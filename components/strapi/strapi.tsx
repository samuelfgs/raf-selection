/** @format */

import {
  ComponentMeta,
  GlobalContextMeta,
  repeatedElement,
  useDataEnv,
  useSelector,
} from "@plasmicapp/host";
import { ActionProps } from "@plasmicapp/host/dist/registerComponent";
import { usePlasmicQueryData } from "@plasmicapp/query";
import L from "lodash";
import qs from "qs";
import React, { ReactNode, useContext } from "react";
import { StrapiItemProvider, ObjectPath, getAllContentTypes, fillDataEnvWithSchema, strapiModalSchemaGet } from "./helper";
import { Menu, Dropdown, Button } from "antd";
import "@plasmicpkgs/antd/dist/antd.css";

export function ensure<T>(x: T | null | undefined): T {
  if (x === null || x === undefined) {
    debugger;
    throw new Error(`Value must not be undefined or null`);
  } else {
    return x;
  }
}

const modulePath = "@plasmicpkgs/plasmic-strapi";

interface StrapiCredentialsProviderProps {
  host?: string;
  token?: string;
}

export const CredentialsContext = React.createContext<
  StrapiCredentialsProviderProps | undefined
>(undefined);

export const strapiCredentialsProviderMeta: GlobalContextMeta<StrapiCredentialsProviderProps> =
  {
    name: "StrapiCredentialsProvider2",
    displayName: "Strapi Credentials Provider",
    description:
      "API token is needed only if data is not publicly readable. Learn how to [get your API token](https://docs.strapi.io/user-docs/latest/settings/managing-global-settings.html#managing-api-tokens).",
    importName: "StrapiCredentialsProvider",
    importPath: modulePath,
    props: {
      host: {
        type: "string",
        displayName: "Host",
        defaultValueHint: "https://strapi-plasmic.herokuapp.com",
        defaultValue: "https://strapi-plasmic.herokuapp.com",
        description: "Server where you application is hosted.",
      },
      token: {
        type: "string",
        displayName: "API Token",
        description:
          "API Token (generated in http://yourhost/admin/settings/api-tokens) (or leave blank for unauthenticated usage).",
      },
    },
  };

export function StrapiCredentialsProvider({
  host,
  token,
  children,
}: React.PropsWithChildren<StrapiCredentialsProviderProps>) {
  console.log(`StrapiCredentialsProvider: strapi host is ${host}`)
  host = host?.slice(-1) === "/" ? host.slice(0, -1) : host;
  return (
    <CredentialsContext.Provider value={{ host, token }}>
      {children}
    </CredentialsContext.Provider>
  );
}

interface StrapiCollectionProps {
  name?: string;
  children?: ReactNode;
  className?: string;
  noLayout?: boolean;
  query?: Record<string, any>;
}

export const strapiCollectionMeta: ComponentMeta<StrapiCollectionProps> = {
  name: "StrapiCollection2",
  displayName: "Strapi Collection",
  importName: "StrapiCollection",
  importPath: modulePath,
  description:
    "Fetches Strapi data of a given collection and repeats content of children once for every row fetched.",
  defaultStyles: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    gridRowGap: "8px",
    gridColumnGap: "8px",
    padding: "8px",
    maxWidth: "100%",
  },
  props: {
    children: {
      type: "slot",
      defaultValue: {
        type: "vbox",
        children: {
          type: "component",
          name: "StrapiField2",
        },
      },
    },
    name: {
      type: "string",
      displayName: "Name",
      description: "Name of the collection to be fetched.",
      defaultValueHint: "restaurants",
    },
    query: {
      type: "object",
      displayName: "Query",
      description: "Query applied to the collection to be fetched.",
    },
    noLayout: {
      type: "boolean",
      displayName: "No layout",
      description:
        "When set, Strapi Collection will not layout its children; instead, the layout set on its parent element will be used. Useful if you want to set flex gap or control container tag type.",
      defaultValue: false,
    },
  },
};


function strapiGet(
  path: string,
  creds: StrapiCredentialsProviderProps,
  query?: Record<string, any>,
) {
  const opts: Record<string, any> = {
    method: "GET"
  };
  if (creds.token) {
    opts.headers = {
      "Authorization": `Bearer ${creds.token}`
    };
  }
  return fetch(`${creds.host}${path}?${qs.stringify(query, {encodeValuesOnly: true})}`, opts)
}
import regimenNavs from "../db/regimen-navs.json";
import modelSchemaRegimenNavs from "../db/model-schema.json";

export function StrapiCollection({
  name,
  children,
  noLayout,
  query,
  ...rest
}: StrapiCollectionProps) {
  const creds = ensure(useContext(CredentialsContext));

  const dataKey = JSON.stringify({creds, name, query, type: "query"});
  const { data, error, isLoading } = usePlasmicQueryData<any[] | null>(dataKey, async () => {
    if (!creds.host || !name) {
      return null;
    }
    
    if (name === "regimen-navs")
      return regimenNavs;
    const resp = await strapiGet(`/api/${name}`, creds, query);
    return resp.json();
  });

  const schemaKey = JSON.stringify({creds, name, query, type: "schema"});
  const { data: schema, error: schemaError } = usePlasmicQueryData<any | null>(schemaKey, async () => {
    if (!creds.host || !creds.token || !name) {
      return null;
    }

    if (name === "regimen-navs")
      return modelSchemaRegimenNavs;
    return strapiModalSchemaGet(creds, name, query);
  });

  if (!creds.host) {
    return <div {...rest}>Please specify a Strapi host and token.</div>;
  }

  if (!name) {
    return <div {...rest}>Please specify a valid collection name.</div>;
  }
  if (error || schemaError) {
    return <div {...rest}>Error fetching Strapi collection.</div>
  }

  if (!data) {
    // loading...
    return null;
  }

  const collection = L.get(data, ["data"]) as any[];

  const repElements = collection.map((item, index) => (
    <StrapiItemProvider 
      key={item.id} 
      name={"strapiItem"} 
      data={item}
      schema={schema}
    >
      {repeatedElement(index === 0, children)}
    </StrapiItemProvider>
  ));

  return noLayout ? (
    <> {repElements} </>
  ) : (
    <div {...rest}> {repElements} </div>
  );
}

interface StrapiFieldProps {
  className?: string;
  path?: ObjectPath;
  hidePlaceholder?: boolean;
  setControlContextData?: (data: {
    data: any;
    strapiCreds: any;
    contentTypes?: {
      uid: string,
      id: string,
    }[];
  }) => void;
}

function UpdateEntry ({ contextData, studioOps }: ActionProps<any>) {
  const { strapiCreds, contentTypes } = contextData;

  const showEditModal = (contentType: any) =>
    studioOps.showModal({
      style: {
        width: "90vw",
      },
      children: (
        <iframe 
          src={`${strapiCreds.host}/admin/content-manager/collectionType/${contentType?.uid}/${contentType?.id}`}
          width="100%"
          style={{
            height: "80vh",
          }}
        />
      ),
      onClose: () => studioOps.refreshQueryData()
    });

  const menu = <Menu
    items={(contentTypes ?? []).map((contentType: any) => {
      return {
        key: JSON.stringify(contentType),
        label: (
          <div
            onClick={() => showEditModal(contentType)}
          >
            {contentType.uid}/{contentType.id}
          </div>
        )
      }
    })}
  />
  
  return (contentTypes &&
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: "10px",
        justifyContent: 'space-between',
        padding: '0px 10px 0px 10px'
      }}
    >
      {contentTypes.length > 1 ? (
        <Dropdown overlay={menu} trigger={["click"]}>
          <Button block={true} type={"primary"}>
            Edit entry
          </Button>
        </Dropdown> 
      ): (
        <Button 
          onClick={() => showEditModal(contentTypes[0])}
          block={true}
          type={"primary"}
          style={{
            height: "auto",
            whiteSpace: "normal"
          }}
        >
          Edit entry: {contentTypes[0].uid}/{contentTypes[0].id}
        </Button>
      )}
    </div>
  )
};

export const strapiFieldMeta: ComponentMeta<StrapiFieldProps> = {
  name: "StrapiField2",
  displayName: "Strapi Field",
  importName: "StrapiField",
  importPath: modulePath,
  props: {
    path: {
      type: "dataSelector",
      data: (props: any, ctx: any) => ctx?.data,
      displayName: "Field",
      description: "Field name",
    },
    hidePlaceholder: {
      type: "boolean",
      defaultValue: true
    }
  },
  actions: [{
    type: "custom-action",
    comp: UpdateEntry
  }]
};

const isPlaceholder = (dataEnv: Record<string, any>, path: ObjectPath) => {
  const dataEnvWithSchema = fillDataEnvWithSchema(dataEnv ?? {}, { addMetadata: true});
  let currData = dataEnvWithSchema;
  for (const key of path) {
    if (currData?.__schema) {
      return true;
    }
    currData = L.get(currData, key);
}
  return currData?.__schema;
}

export function StrapiField({
  path, //Note: path is Field Name
  setControlContextData,
  hidePlaceholder,
  ...rest
}: StrapiFieldProps) {
  const creds = ensure(useContext(CredentialsContext));

  const dataEnv = useDataEnv();
  const strapiItem = useSelector("strapiItem");

  const dataEnvWithSchema = fillDataEnvWithSchema(dataEnv ?? {}, { addMetadata: true});
  setControlContextData?.({
    data: dataEnvWithSchema,
    strapiCreds: creds,
  });

  if (!dataEnv || !strapiItem) {
    return <div>StrapiField must be used inside a StrapiCollection</div>
  }

  if (!path) {
    return <div>StrapiField must specify a field name.</div>;
  }
  const data = L.get(dataEnvWithSchema, path);

  const contentTypes = getAllContentTypes(dataEnv, path);
  setControlContextData?.({
    data: dataEnvWithSchema,
    strapiCreds: creds,
    contentTypes
  })

  if (!data) {
    return <div {...rest}>Please specify a valid field name.</div>;
  } else if (isPlaceholder(dataEnv, path)) {
    return !hidePlaceholder ? (
      <div {...rest}>{
        typeof data === "object"
          ? "[object Object]"
          : data
      } placeholder</div>
    ) : null;
  } else if (data?.data?.attributes?.mime?.startsWith("image")) {
    const attrs = data.data.attributes;
    const img_url = attrs.url.startsWith("http")
      ? attrs.url
      : creds.host + attrs.url;
    const img_width = attrs.width;
    const img_height = attrs.height;
    return (
      <img
        {...rest}
        src={img_url}
        width={img_width}
        height={img_height}
        />
    );
  } else if (L.isObject(data)) {
    return <div {...rest}>Select a vaild field.</div>;
  } else {
    return <div {...rest}>{data}</div>;
  }
}

interface StrapiRepeatedElementProps {
  className?: string;
  path?: ObjectPath;
  children?: React.ReactNode;
  setControlContextData?: (data: {
    data: any;
  }) => void;
}

export const strapiRepeatedElementMeta: ComponentMeta<StrapiRepeatedElementProps> = {
  name: "StrapiRepeatedElement",
  displayName: "Strapi Repeated Element",
  importName: "StrapiRepeatedElement",
  importPath: modulePath,
  props: {
    path: {
      type: "dataSelector",
      data: (_: any, ctx: any) => ctx?.data ?? {},
      displayName: "Element",
      description: "Element name name",
    },
    children: "slot"
  },
};

export function StrapiRepeatedElement({
  path, //Note: path is Field Name
  children,
  setControlContextData,
  ...rest
}: StrapiRepeatedElementProps) {
  const dataEnv = useDataEnv();
  const dataEnvWithSchema = fillDataEnvWithSchema(dataEnv ?? {}, {addMetadata: true});
  setControlContextData?.({
    data: dataEnvWithSchema
  });

  if (!path) {
    return <div>StrapiField must specify a field name.</div>;
  }

  const dataWithSchema = L.get(dataEnvWithSchema, path);
  if (L.isArray(dataWithSchema)) {
    return <>
      {dataWithSchema.map((item, i) =>
        <StrapiItemProvider
          data={{
            index: i+1,
            item
          }}
          name={"currentItem"} 
          key={i}
          path={path}
        >
          {repeatedElement(i === 0, children)}
        </StrapiItemProvider>
      )}
    </>
  } else {
    return <div {...rest}>Please specify a valid field name.</div>;
  } 
}

interface StrapiLinkProps {
  path?: string;
  children?: React.ReactNode;
  className?: string;
  setControlContextData?: (data: {
    data: any;
  }) => void;
}

export const strapiLinkMeta: ComponentMeta<StrapiLinkProps> = {
  name: "StrapiLink",
  displayName: "Strapi Link",
  importName: "StrapiLink",
  importPath: modulePath,
  props: {
    path: {
      type: "dataSelector",
      data: (_: any, ctx: any) => ctx?.data ?? {},
      displayName: "Field",
      description: "Field path",
    },
    children: "slot"
  },
  isAttachment: true
};

export function StrapiLink({
  path,
  children,
  setControlContextData,
  ...rest
}: StrapiLinkProps) {
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

  setControlContextData?.({
    data: items
  });

  if (!path) {
    return <div {...rest}>{children}</div>;
  }

  const data = L.get(items, path);

  if (typeof data === "string") {
    return <a href={`${data}`} style={{color: "inherit", textDecoration: "inherit"}} {...rest}>
      {children}
    </a>
  } else {
    return <div {...rest}>{children}</div>;
  } 
}