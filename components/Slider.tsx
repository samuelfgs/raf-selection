/** @format */

import {
    cloneElement,
    createContext,
    ReactNode,
    useContext,
    useState,
  } from "react";
  import * as React from "react";
  
  function useSliderController() {
    const [offset, setOffset] = useState(0);
    const [counter, setCounter] = useState(0);
    const [lastOp, setLastOp] = useState<"left" | "right">("left");
    const right = () => {
      setCounter(counter + 1);
      setLastOp("right");
    };
    const left = () => {
      setCounter(counter + 1);
      setLastOp("left");
    };
    return { offset, counter, lastOp, right, left };
  }
  
  type SliderControl = ReturnType<typeof useSliderController>;
  
  const SliderContext = createContext<SliderControl | undefined>(undefined);
  
  export function SliderProvider({ children }: { children: ReactNode }) {
    const sliderController = useSliderController();
    return (
      <SliderContext.Provider value={sliderController}>
        {children}
      </SliderContext.Provider>
    );
  }
  
  export function SliderButton({
    children,
    action,
  }: {
    children: ReactNode;
    action?: "left" | "right";
  }) {
    const ctx = useContext(SliderContext);
    if (!ctx) {
      return <div>SliderButton must be placed inside a SliderProvider</div>;
    }
    return cloneElement(React.Children.only(children) as any, {
      onClick: () => {
        if (action === "left") {
          ctx.left();
        } else if (action === "right") {
          ctx.right();
        }
      },
    });
  }
  
  export default function Slider({
    className,
    children,
  }: {
    className?: string;
    children: ReactNode;
  }) {
    const ctx = useContext(SliderContext);
    const ref = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
      const el = ref.current;
      if (el) {
        el.scroll({
          left: el.scrollLeft + 400 * (ctx?.lastOp === "right" ? +1 : -1),
          behavior: "smooth",
        });
      }
    }, [ctx?.offset, ctx?.lastOp, ctx?.counter]);
    if (!ctx) {
      return <div>Slider must be placed inside a SliderProvider</div>;
    }
    return (
      <div className={className} ref={ref}>
        {children}
      </div>
    );
  }