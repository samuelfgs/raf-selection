import React from "react";
import L from "lodash";
import { useSelector } from "@plasmicapp/host";
import { RegimenControllerContext } from "./RegimenController";

export default function RegimenColorTheme ({
  type,
  children,
}: {
  type?: string,
  children?: React.ReactNode
}) {
  const regimenController = useSelector("regimenController") as RegimenControllerContext;
  if (!regimenController) {
    return <div>RegimenColorTheme must be used within a RegimenController</div>;
  }
  const colorTheme = L.get(
    regimenController.activeRegimen, 
    ["regimen", "data", "attributes", "regimenColorTheme"]
  ) ?? "#0000ff";

  const newStyle = type ? { [type]: colorTheme} : {}
  return React.isValidElement(children)
    ? React.cloneElement(children, {style: {...children.props.style, ...newStyle}})
    : null;
}