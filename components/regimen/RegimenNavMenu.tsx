import React from "react";
import { repeatedElement, useSelector } from "@plasmicapp/host";
import { RegimenControllerContext } from "./RegimenController";
import { StrapiItemProvider } from "../strapi/helper";

export default function RegimenNavMenu ({
  activeRegimenSlot,
  nonActiveRegimenSlot,
}: {
  className?: string,
  activeRegimenSlot?: React.ReactNode,
  nonActiveRegimenSlot?: React.ReactNode,
}) {
  const regimenController = useSelector("regimenController") as RegimenControllerContext;
  if (!regimenController) {
    return <div>RegimenColorTheme must be used within a RegimenController</div>;
  }

  const activeRegimen = regimenController.activeRegimen;
  const regimens = regimenController.regimens as any[];

  const activeRegimenIndex = Math.max(0, regimens.findIndex(_regimen => _regimen === activeRegimen));
  const primaryNonActiveRegimenIndex = activeRegimenIndex > 0 ? 0 : 1;

  const attachOnClick = (elt: React.ReactNode, regimen: any) => 
    React.isValidElement(elt)
      ? React.cloneElement(elt, {
          onClick: () => {
            if (typeof elt.props.onClick === "function") {
              elt.props.onClick();
            }
            regimenController.onRegimenSelect(regimen.id);
          }
        })
      : null;
  
  return <>
    {regimens.map((regimen, i) => 
      <StrapiItemProvider 
        key={regimen.id} 
        name={"currentRegimenNavMenu"} 
        data={regimen}
        path={["strapiItem", "attributes", "entries", i]}
      >
        {regimen === activeRegimen
          ? attachOnClick(activeRegimenSlot, regimen)
          : repeatedElement(
            primaryNonActiveRegimenIndex === i,
            attachOnClick(nonActiveRegimenSlot, regimen)
        )}
      </StrapiItemProvider>
    )}
  </>
}