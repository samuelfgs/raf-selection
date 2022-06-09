import { usePlasmicQueryData } from "@plasmicapp/query";
import React from "react";
import { CredentialsContext, ensure } from "../strapi/strapi";
import L from "lodash";
import qs from "qs";
import { repeatedElement } from "@plasmicapp/host";
import { StrapiItemProvider, strapiModalSchemaGet } from "../strapi/helper";

const query = {
  populate: {
    body: {
      populate: {
        sub_menu_groups: {
          populate: "*",
        }
      }
    }
  }
}

export function HeaderMenu ({
  className,
  selectedMenu,
  subMenuGroupSlot,
  singleSubMenuSlot,
  menuItemSlot,
  setControlContextData,
}: {
  className?: string,
  selectedMenu?: number,
  menuItemSlot?: React.ReactNode,
  singleSubMenuSlot?: React.ReactNode,
  subMenuGroupSlot?: React.ReactNode,
  menuLabelSlot?: React.ReactNode,
  setControlContextData?: (data: {
    name: {label: string, value: number}[]
  }) => void
}) {
  const creds = ensure(React.useContext(CredentialsContext));

  const opts: Record<string, any> = {
    method: "GET"
  };
  if (creds.token) {
    opts.headers = {
      "Authorization": `Bearer ${creds.token}`
    };
  }

  const dataKey = JSON.stringify({creds, type: "menu"});
  const { data, error, isLoading } = usePlasmicQueryData<any | null>(dataKey, async () => {
    if (!creds.host) {
      return null;
    }
    return (await fetch(`${creds.host}/api/menus?${qs.stringify(query)}`, opts)).json();
  });

  const schemaKey = JSON.stringify({creds, type: "menu-schema"});
  const { data: schema, error: schemaError } = usePlasmicQueryData<any | null>(schemaKey, async () => {
    if (!creds.host || !creds.token) {
      return null;
    }

    return strapiModalSchemaGet(creds, "menus", query);
  });

  if (!creds.host) {
    return <div className={className}>Please specify a Strapi host and token.</div>;
  }
  if (error || schemaError) {
    return <div className={className}>Error fetching Strapi collection.</div>
  }
  if (isLoading || !data) {
    return null;
  }
  const menuItems = data.data as any[];

  setControlContextData?.({
    name: menuItems.map((menuItem, i) => ({
      label: L.get(menuItem, ["attributes", "name"]),
      value: i
    }))
  })

  const menu = selectedMenu !== undefined ? menuItems?.[selectedMenu] : undefined;

  if (!menu) {
    return <div className={className}>Menu not found!</div>
  }

  const menuBody = L.get(menu, ["attributes", "body"]) as any[];

  const isSubMenuGroup  = (menuBodyItem: any) => 
    "sub_menu_groups" in menuBodyItem && menuBodyItem.sub_menu_groups.data.length > 1;
  
  const isSingleSubMenu = (menuBodyItem: any) => 
    !isSubMenuGroup(menuBodyItem) && "sub_menu_groups" in menuBodyItem;

  const isMenuItem = (menuBodyItem: any) => !("sub_menu_groups" in menuBodyItem);

  const primarySubMenuGroup = menuBody.find(bodyItem => isSubMenuGroup(bodyItem));
  const primarySingleSubMenu = menuBody.find(bodyItem => isSingleSubMenu(bodyItem));
  const primaryMenuItem = menuBody.find(bodyItem => isMenuItem(bodyItem));
  
  return <>
    <StrapiItemProvider 
      name={"strapiItem"}
      data={menu}
      schema={schema}
    >
      {menuBody.map((menuBodyItem, i) => 
        <React.Fragment
          key={JSON.stringify({id: menuBodyItem.id, label: menuBodyItem.label}) /* menuBodyItem.id is not unique */}
        >
          {isMenuItem(menuBodyItem) ? (
            <StrapiItemProvider
              data={menuBodyItem}
              name={"currentMenuItem"}
              path={["strapiItem", "attributes", "body", i]}
            >
              {repeatedElement(menuBodyItem === primaryMenuItem, menuItemSlot)}
            </StrapiItemProvider>
          ) : (
            <StrapiItemProvider
              data={menuBodyItem}
              name={"currentMenuItem"}
              path={["strapiItem", "attributes", "body", i]}
            >
              {isSingleSubMenu(menuBodyItem) &&
                repeatedElement(
                  menuBodyItem === primarySingleSubMenu, singleSubMenuSlot
                )
              }
              {isSubMenuGroup(menuBodyItem) &&
                repeatedElement(menuBodyItem === primarySubMenuGroup, subMenuGroupSlot) 
              }
            </StrapiItemProvider>
          )}
        </React.Fragment>
      )}
    </StrapiItemProvider>
  </>
}
