import React from "react";
import L from "lodash";
import { DataProvider, useSelector } from "@plasmicapp/host";
import { StrapiItemProvider } from "../strapi/helper";

export interface RegimenControllerContext {
  regimens: any[];
  onRegimenSelect: (regimen: string) => void;
  activeRegimen?: any;
}

export default function RegimenController ({
  className,
  selectedRegimen,
  noRegimenSelected,
  children,
  setControlContextData,
}: {
  className?: string,
  selectedRegimen?: string,
  children?: React.ReactNode,
  noRegimenSelected?: React.ReactNode,
  setControlContextData?: (data: {
    regimens: {
      label: string,
      value: number
    }[];
  }) => void,
}) {
  const [ activeRegimen, setActiveRegimen ] = React.useState(selectedRegimen);
  const item = useSelector("strapiItem");

  React.useEffect(() => {
    setActiveRegimen(selectedRegimen);
  }, [selectedRegimen]);
  
  if (!item) {
    return <div>RegimenController must be used within a StrapiCollection</div>;
  }

  const regimens = L.get(item.item, ["attributes", "entries"]) as any[]

  if (!regimens) {
    return <div className={className}>Regimen data not found. Check your Strapi collection</div>
  }

  setControlContextData?.({
    regimens: regimens.map(regimen => ({
      label: regimen.label,
      value: regimen.id
    }))
  })

  const regimen = regimens.find(regimen => regimen.id === activeRegimen);
  
  const regimenController: RegimenControllerContext = {
    regimens,
    onRegimenSelect: (regimen: string) => setActiveRegimen(regimen),
    activeRegimen: regimen
  }
  return (
    <DataProvider data={regimenController} name={"regimenController"}>
      {!regimen && noRegimenSelected}
      <StrapiItemProvider
        data={regimen}
        name={"currentRegimen"}
        path={["strapiItem", "attributes", "entries", regimens.indexOf(regimen)]}
      >
        <div className={className} style={{
          opacity: regimen ? 1 : 0,
          transitionDuration: "1s",
          height: regimen ? undefined : 0,
          overflow: "hidden",
          transitionProperty: "all",
          transitionTimingFunction: "ease-in",
          transform: !regimen ? "translateY(500px)" : undefined,
        }}>
          {children}
        </div>
      </StrapiItemProvider>
    </DataProvider>
  )
}