
import React from "react";
import L from "lodash";
import { DataProvider, repeatedElement, useSelector } from "@plasmicapp/host";
import { RegimenControllerContext } from "./RegimenController";
import { StrapiItemProvider } from "../strapi/helper";

export default function RegimenProductBundle ({
  className,
  staticBundleSlot,
  configurableBundleSlot,
}: {
  className?: string,
  staticBundleSlot?: React.ReactNode,
  configurableBundleSlot?: React.ReactNode
}) {
  const regimenController = useSelector("regimenController") as RegimenControllerContext;
  if (!regimenController) {
    return <div>RegimenProductBundle must be used within a RegimenController</div>;
  }

  const activeRegimen = regimenController.activeRegimen;

  const item = L.get(activeRegimen, [
    "regimen",
    "data",
    "attributes",
    "itemizedContent",
    0,
  ]);

  let bundle = undefined;
  let type: "configurable" | "static" | undefined = undefined;
  const path = ["currentRegimen", "regimen", "data", "attributes", "itemizedContent", 0];
  if (item && "static_bndl_list" in item) {
    bundle = item["static_bndl_list"];
    type = "static";
    path.push("static_bndl_list");
  } else if (item && "cfg_bundle_list" in item) {
    bundle = item["cfg_bundle_list"];
    type = "configurable";
    path.push("cfg_bundle_list");
  }

  return <>
    {type === "configurable" ?
      (L.get(bundle, ["data", "attributes", "options"]) ?? []).map((option: any, i: number) => 
        repeatedElement(
          i as any,
          <ConfigurableBundleController 
            bundleOption={option}
            path={[...path, "data", "attributes", "options", i]}
          >
            {configurableBundleSlot}
          </ConfigurableBundleController>
        )
    ) : type === "static" ?
      (L.get(bundle, ["data", "attributes", "items"]) ?? []).map((item: any, i: number) =>
        <StrapiItemProvider 
          name={"currentBundleProduct"} 
          data={item} 
          key={item.id}
          path={[...path, "data", "attributes", "items", i]}
        >
          {repeatedElement(
            i === 0,
            staticBundleSlot
          )}
        </StrapiItemProvider>
      )
      : <span className={className}>Product bundle not found!</span>
    }
  </>
}

export const ConfigurableBundleController = ({
  children,
  bundleOption,
  path,
}: {
  children?: React.ReactNode
  bundleOption: any,
  path: (string | number)[],
}) => {
  const [selectedProduct, setSelectedProduct] = React.useState(L.get(bundleOption, ["itemOptions", 0]));

  const controllerFunction = {
    bundleItem: bundleOption,
    selectedProduct,
    setSelectedProduct
  };

  return <DataProvider data={controllerFunction} name={"bundleController"}>
    <StrapiItemProvider 
      name={"currentBundleItem"} 
      data={bundleOption}
      path={[...path]}
    >
      <StrapiItemProvider
        name={"currentBundleSelectedProduct"}
        data={selectedProduct}
        path={["currentBundleItem", "itemOptions", bundleOption.itemOptions.indexOf(selectedProduct)]}
      >
        {children}
      </StrapiItemProvider>
    </StrapiItemProvider>
  </DataProvider>
}

export const RegimenProductBundleOptions = ({
  activeOptionSlot,
  nonActiveOptionSlot
}: {
  activeOptionSlot?: React.ReactNode,
  nonActiveOptionSlot?: React.ReactNode,
}) => {
  const bundleController = useSelector("bundleController");
  const path = useSelector("currentBundleProduct")?.path;
  if (!bundleController) {
    return <div>RegimenProductBundleOptions must be used within a RegimenProductBundle</div>;
  }
  const itemOptions = bundleController.bundleItem.itemOptions as any[] | undefined;
  
  return <>
    {(itemOptions ?? []).map((productOption, i) => 
    <DataProvider 
      data={{
        onClick: () => bundleController.setSelectedProduct(productOption)
      }} 
      name={"buttonAction"}
      key={i}
    >
      <StrapiItemProvider 
        data={productOption} 
        name={"currentBundleProductOption"}
        path={["currentBundleItem", "itemOptions", i]}
      >
        {productOption === bundleController.selectedProduct
          ? activeOptionSlot
          : repeatedElement(
            itemOptions?.[0] === bundleController.selectedProduct
              ? i === 1
              : i === 0,
            nonActiveOptionSlot)
        }
      </StrapiItemProvider>
    </DataProvider>
    )}
  </>
  
}