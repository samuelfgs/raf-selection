import { DataProvider, useDataEnv } from "@plasmicapp/host";
import qs from "qs";
import React from "react";


export const useStrapiItems = () => {
  const env = useDataEnv();
  if (!env) {
    return null;
  }
  const items: Record<string, any> = {};
  for (const item in env) {
    if (env[item].isStrapiItem) {
      items[item] = env[item].item;
    }
  }
  return items;
}

interface ContentTypeId {
  uid: string;
  id: string;
}

export type ObjectPath = (string | number)[];

const traverseSchema = (
  selector: string,
  data: Record<string, any>,
  schema: Record<string, any>,
  path: ObjectPath,
) => {
  if (!schema || !data) {
    return {}
  }
  let currSchema = schema;
  let currData = data;
  const contentTypes: ContentTypeId[] = [];

  if (selector === "currentItem") {
    if (path[0] === "item") {
      currSchema = currSchema[0];
      currData = currData["item"];
      path = path.slice(1);
    } else {
      return {
        schema: {},
        contentTypes: []
      }
    }
  }

  for (const key of path) {
    if (!currSchema || !currData) {
      return {
        schema: undefined,
        contentTypes: undefined
      };
    }
    if (currSchema && "__uid" in currSchema) {
      contentTypes.push({
        uid: currSchema.__uid,
        id: currData.id
      })
    }
    if (typeof key === "string") {
      currSchema = currSchema[key];
      currData = currData[key];
    } else {
      if ("item" in currData)
        currData = currData.item;
      else
        currData = currData[key];
      
      if (!currData) {
        return {
          schema: {},
          contentTypes: []
        }
      }
      if ("__component" in currData) {
        currSchema = currSchema.find((schema: any) => schema.__component === currData.__component);
      } else { // just a repeated entity
        currSchema = currSchema[0];
      }
    }
  }
  return {
    schema: currSchema,
    contentTypes
  }
}

interface StrapiItemInfo {
  rootSchema: any;
  contentTypes: ContentTypeId[];
}

export const computeStrapiItemInfo = (
  allData: Record<string, any>, 
  path: ObjectPath,
  schema: Record<string, any> | undefined,
): StrapiItemInfo => {
  if (path.length === 0) { // new root
    return { 
      rootSchema: schema,
      contentTypes: [],
    }
  }

  let [ selector, ...strapiPath ] = path;
  if (!(selector in allData)) { // new root
    throw Error("new root can't have a path");
  } 

  const parentSchema = allData[selector].info.rootSchema;
  const parentData = allData[selector].item;
  const { schema : rootSchema, contentTypes } = traverseSchema(
    selector as string,
    parentData,
    parentSchema,
    strapiPath
  );
  return {
    rootSchema,
    contentTypes: [
      ...allData[selector].info.contentTypes,
      ...(contentTypes ?? [])
    ],
  }
}

export const StrapiItemProvider = ({
 name,
 data,
 children,
 schema,
 path,
}: {
  name: string,
  data: any,
  children: React.ReactNode,
  schema?: any,
  path?: ObjectPath,
}) => {
  const allData = useDataEnv() ?? {};

  return <DataProvider 
    name={name} 
    data={{
      isStrapiItem: true,
      item: {...data},
      info: computeStrapiItemInfo(allData, path ?? [], schema)
    }}
  >
    {children}
  </DataProvider>
}

export const getAllContentTypes = (allData: Record<string, any>, path: ObjectPath) => {
  let [ selector, ...strapiPath ] = path;
  if (!(selector in allData)) {
    return [];
  }

  return [
    ...allData[selector].info.contentTypes,
    ...(traverseSchema(
      selector as string,
      allData[selector].item,
      allData[selector].info.rootSchema,
      strapiPath
    ).contentTypes ?? [])
  ]
}


export const strapiModalSchemaGet = async (
  creds: {host?: string, token?: string},
  model: string,
  query?: Record<string, any>
) => {
  const opts = { headers: { Authorization: `Bearer ${creds.token}`}};
  const schema = await (
    await fetch(
      `${creds.host}/api/model-schema?${qs.stringify({query, model, deep: true})}`,
      opts
    )
  ).json();
  
  const rootSchema = await (
    await fetch(
      `${creds.host}/api/model-schema?${qs.stringify({model})}`,
      opts
    )
  ).json();
  
  return {
    ...schema,
    "__uid": rootSchema?.uid
  }
}

const addSchemaMetadataProp = (schema: any): any => 
  typeof schema !== "object" || !schema
    ? schema
    : Array.isArray(schema)
      ? schema.map((item: any) => addSchemaMetadataProp(item))
      : {
          ...Object.fromEntries(
            Object.entries(schema)
              .map(([key, schema]) =>
                [key, addSchemaMetadataProp(schema)]
              )
          ),
          __schema: true
      }

export const fillMissingDataWithSchema = 
  (data: Record<string, any>, schema: Record<string, any>, opts?: { addMetadata: boolean }): Record<string, any> => (
  {
    ...(!schema ? {} : Object.fromEntries(
      Object.entries(schema)
      .filter(([key, _]) => key !== "__uid")
      .map(([key, schemaValue]) => {
        if (key in data && data[key] !== null) {
          if (typeof data[key] !== "object" || !schemaValue || schemaValue === "media") {
            return [key, data[key]];
          }
          if (!Array.isArray(data[key])) {
            return [key, fillMissingDataWithSchema(data[key], schemaValue, opts)];
          }
          if (data[key].length === 0) {
            return [key,
              opts?.addMetadata
                ? addSchemaMetadataProp(schemaValue)
                : schemaValue
            ]
          }
          if (schemaValue.some((schema: any) => "__uid" in schema)) { //relation
            return [key, data[key].map((dataVal: any) => 
              fillMissingDataWithSchema(dataVal, schemaValue[0], opts)
            )];
          }
          if (schemaValue.some((schema: any) => "__component" in schema)) { //dynamic
            return [key, data[key].map((dataVal: any) =>
              fillMissingDataWithSchema(dataVal, 
                schemaValue.find((schemaVal: any) =>
                  schemaVal.__component === dataVal.__component
                ), opts
              )
            )]
          }
          return [key, data[key].map((dataVal: any) =>
            fillMissingDataWithSchema(dataVal, schemaValue[0], opts)
          )];
        } else {
          return [key,
            opts?.addMetadata
              ? addSchemaMetadataProp(schemaValue)
              : schemaValue
          ]
        }
      })
    )),
    ...Object.fromEntries(
      Object.entries(data)
      .filter(([key, _]) => 
        schema && !(key in schema) 
      )
    )
  }
)

export const fillDataEnvWithSchema = 
  (dataEnv: Record<string, any>, opts?: { addMetadata: boolean }) => 
  Object.fromEntries(
    Object.entries(dataEnv)
      .filter(([key, data]) => data.isStrapiItem)
      .map(([key, data]) => {
        if (key === "currentItem") {
          return [key, {
            index: data.item.index,
            item: fillMissingDataWithSchema(
              data.item.item,
              data.info.rootSchema?.[0],
              opts
            )
          }];
        } else {
          return [key, fillMissingDataWithSchema(
            data.item,
            data.info.rootSchema,
            opts
          )]
        }
    })
  )