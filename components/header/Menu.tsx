import { usePlasmicCanvasContext } from "@plasmicapp/host";
import React from "react";

interface MenuItemData {
  position?: {
    left: number;
    top: number;
  };
  hoverMenuItemState?: boolean;
  hoverSubMenuState?: boolean;
  subMenu?: React.ReactNode;
  overlay?: React.ReactNode;
  isActive?: boolean;
  stretch?: boolean;
}

export function ensureArray<T>(x: T | T[] | undefined): T[] {
  if (x == null) {
    return [];
  } else if (Array.isArray(x)) {
    return x;
  } else {
    return [x];
  }
}

export function Menu(props: {
  className?: string
  children?: React.ReactNode;
}) {
  const { className, children } = props;

  const [menuItems, setMenuItems] = React.useState<MenuItemData[]>(
    React.Children.map(children, child => ({})) ?? []
  );
  
  const [ forceRender, setForceRender ] = React.useState(0);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      setForceRender(render => render+1);
    });
    observer.observe(ref.current!, { attributes: true, childList: true, subtree: true } );

    return () => observer.disconnect();
  }, [])
  React.useEffect(() => {
    setForceRender(render => render+1);
  }, [children]);
  
  const isItemActive = (menuItem: MenuItemData) =>
    menuItem.hoverMenuItemState || menuItem.hoverSubMenuState || menuItem.isActive
    
  const handleMenuItemUpdate = (i: number) => 
    (menuItemChanges: MenuItemData) => {
      setMenuItems(menuItems => {
        menuItems[i] = {
          ...menuItems[i],
          ...menuItemChanges
        }
        return [...menuItems];
      });
    }

  return <div className={className} 
    style={{
      display: "flex"
    }}
    key={forceRender}
    ref={ref}
  >
    <>
      {React.Children.map(children, (child, i) => 
        React.isValidElement(child) && child.type === MenuItem
          ? React.cloneElement(child as any, {
              onMenuItemUpdate: handleMenuItemUpdate(i)
            })
          : child
      )}
    </>
    <div
      style={{
        position: "absolute",
        width: "100%",
        left: 0
      }}
    >
      {menuItems.map((menuItem, i) => {
        const renderedItem = React.isValidElement(menuItem.subMenu)
          ? React.cloneElement(menuItem.subMenu as any, { 
              isActive: isItemActive(menuItem),
              hasOverlay: React.isValidElement(menuItem.overlay),
              position: menuItem.position,
              onMenuItemUpdate: handleMenuItemUpdate(i),
              key: `subMenu-${i}`
            })
          : null;

        return React.isValidElement(menuItem.overlay)
          ? React.createElement(
              MenuOverlay, {
                ...menuItem.overlay.props,
                position: { ...menuItem.position },
                isActive: isItemActive(menuItem),
                stretch: menuItem.stretch,
                key: `menuOverlay-${i}`
              }, [renderedItem]
            )
          : <React.Fragment key={i}>{renderedItem}</React.Fragment>
      })}
    </div>
  </div>
}

export function MenuItem(props: {
  className?: string,
  label?: React.ReactNode
  children?: React.ReactNode
  overlay?: React.ReactNode
  onMenuItemUpdate?: (changes: MenuItemData) => void;
  isActive?: boolean;
}) {
  const { className, label, overlay, children, isActive, onMenuItemUpdate } = props;
  const inEditor = usePlasmicCanvasContext();
  const ref = React.createRef<HTMLDivElement>();
  const [ hoverState, setHoverState ] = React.useState(false);

  React.useEffect(() => {
    const left = ref.current?.offsetLeft ?? 0;
    const top = ref.current?.clientHeight ?? 0;

    onMenuItemUpdate?.({
      position: { left, top },
      subMenu: children,
      hoverMenuItemState: hoverState,
      overlay,
      isActive: isActive && !!inEditor
    })
  }, []);

  React.useEffect(() => {
    onMenuItemUpdate?.({
      isActive: isActive && !!inEditor
    })
  }, [isActive, inEditor])

  React.useEffect(() => {
    onMenuItemUpdate?.({
      hoverMenuItemState: hoverState
    })
  }, [hoverState]);

  return <div
    className={className} 
    ref={ref} 
    onMouseEnter={() => !inEditor && setHoverState(true)} 
    onMouseLeave={() => !inEditor && setHoverState(false)}
  >
    {label}
  </div>
}

export function MenuSubMenu(props: {
  className?: string;
  items?: React.ReactNode;
  stretch?: boolean;
  overlay?: React.ReactNode;
  position?: { left: number; top: number; };
  isActive?: boolean,
  onMenuItemUpdate?: (changes: MenuItemData) => void;
  hasOverlay?: boolean,
}) {
  const { className, position, items, isActive, onMenuItemUpdate, hasOverlay, stretch } = props;

  const [ hoverState, setHoverState ] = React.useState(false);

  const [ left, setLeft ] = React.useState(props.stretch ? 0 : position?.left ?? 0);

  const inEditor = usePlasmicCanvasContext();
  React.useEffect(() => {
    onMenuItemUpdate?.({
      hoverSubMenuState: hoverState
    })
  }, [hoverState]);

  React.useEffect(() => {
    onMenuItemUpdate?.({stretch});
  }, [stretch]);

  React.useEffect(() => {
    onMenuItemUpdate?.({});
  }, [items]);
  React.useEffect(() => {
    setLeft(props.stretch ? 0 : position?.left ?? 0);
    onMenuItemUpdate?.({});
  }, [props.stretch, position]);

  return <div className={className} 
    style={{
      position: hasOverlay ? "relative" : "absolute",
      ...(hasOverlay
        ? { paddingLeft: left }
        : { left }
      ),      
      top:  !hasOverlay ? (position?.top ?? 0) : 0,
      opacity: isActive ? 1 : 0,
      height: isActive ? "auto" : 0,
      zIndex: 1000,
      width: "auto"
    }}
    onMouseEnter={() => !inEditor && setHoverState(true)}
    onMouseLeave={() => !inEditor && setHoverState(false)}
  >
    {items}
  </div>
}

export function MenuOverlay(props: {
  className?: string;
  children?: React.ReactNode;
  position?: { left: number; top: number; };
  isActive?: boolean;
  test?: any;
  stretch?: boolean;
}) {
  const { className, children, position, isActive, stretch } = props;
  return <div className={className}
    style={{
      position: "absolute",
      left: !stretch ? 0 : 0,
      top: position?.top,
      opacity: isActive ? 1 : 0,
      height: isActive ? "auto" : 0,
      zIndex: 999,
      overflow: "hidden",
    }}
  >
    {children}
  </div>
}