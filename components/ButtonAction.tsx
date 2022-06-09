import { useSelector } from "@plasmicapp/host";
import React, { cloneElement } from "react";

export function ButtonAction({ 
  children, 
  className,
}: { 
  children?: React.ReactNode, 
  className?: string 
}) {
  const buttonActionCtx = useSelector("buttonAction");

  if (React.isValidElement(children)) {
    return cloneElement(children as any, {
      onClick: () => {
        if (typeof children.props.onClick === "function") {
          children.props.onClick();
        }
        buttonActionCtx?.onClick();
      },
      className: `${children.props.className ?? ""} ${className}`
    });
  } else {
    return <>{children}</>
  }
}