import { initPlasmicLoader } from "@plasmicapp/loader-nextjs";
import Collapse from "./components/Collapse";
import Slider, { SliderButton, SliderProvider } from "./components/Slider";
import { ButtonAction } from "./components/ButtonAction";
import { registerAll as strapiRegisterAll } from "./components/strapi/index";
import RegimenNavMenu from "./components/regimen/RegimenNavMenu";
import RegimenColorTheme from "./components/regimen/RegimenColorTheme";
import { HeaderMenu } from "./components/header/HeaderMenu";
import { Menu, MenuItem, MenuOverlay, MenuSubMenu } from "./components/header/Menu";
import RegimenController from "./components/regimen/RegimenController";
import RegimenProductBundle, { RegimenProductBundleOptions } from "./components/regimen/RegimenProductBundle";
import { registerYouTube } from "./components/Youtube";


export const PLASMIC = initPlasmicLoader({
  projects: [
    {
      id: `${process.env["PLASMIC_ID"]}`,
      token: `${process.env["PLASMIC_TOKEN"]}`,
      version: `${process.env["PLASMIC_TAG"]}`,  //Note semver or tag
    },
  ],

  // By default Plasmic will use the last published version of your project.
  // For development, you can set preview to true, which will use the unpublished
  // project, allowing you to see your designs without publishing.  Please
  // only use this for development, as this is significantly slower.
  //preview: false,
  preview: `${process.env["PLASMIC_PREVIEW"]}`.toLowerCase()==="true" || false,
});

// You can register any code components that you want to use here; see
// https://docs.plasmic.app/learn/code-components-ref/
// And configure your Plasmic project to use the host url pointing at
// the /plasmic-host page of your nextjs app (for example,
// http://localhost:3000/plasmic-host).  See
// https://docs.plasmic.app/learn/app-hosting/#set-a-plasmic-project-to-use-your-app-host

// PLASMIC.registerComponent(...);

PLASMIC.registerComponent(Collapse, {
  name: "Collapse",
  description: "A collapsible component",
  props: {
    children: {
      type: "slot",
      defaultValue: "Collapse component body",
    },
    header: {
      type: "slot",
      defaultValue: "Collapse component header",
    },
    previewOpen: "boolean",
  },
});

PLASMIC.registerComponent(SliderProvider, {
  name: "SliderProvider",
  props: {
    children: {
      type: "slot",
    },
  },
});

PLASMIC.registerComponent(Slider, {
  name: "CustomSlider",
  defaultStyles: {
    overflowX: "auto",
  },
  props: {
    children: {
      type: "slot",
    },
  },
});

PLASMIC.registerComponent(SliderButton, {
  name: "SliderButton",
  props: {
    action: {
      type: "choice",
      options: ["right", "left"],
      defaultValue: "right",
    },
    children: {
      type: "slot",
      defaultValue: {
        type: "text",
        value: ">",
        style: {
          padding: "8px",
        },
      },
    },
  },
})

PLASMIC.registerComponent(ButtonAction, {
  name: "ButtonAction",
  props: {
    children: "slot"
  },
  isAttachment: true
});

strapiRegisterAll(PLASMIC);

PLASMIC.registerComponent(RegimenColorTheme, {
  name: "RegimenColorTheme",
  props: {
    children: "slot",
    type: {
      type: "choice",
      options: ["color", "backgroundColor", "borderColor"]
    },
  },
  isAttachment: true,
  parentComponentName: "RegimenController"
});


PLASMIC.registerComponent(RegimenNavMenu, {
  name: "RegimenNavMenu",
  props: {
    activeRegimenSlot: {
      type: "slot",
      displayName: "activeRegimen"
    },
    nonActiveRegimenSlot: {
      type: "slot",
      displayName: "nonActiveRegimen"
    }
  },
  parentComponentName: "RegimenController"
})

PLASMIC.registerComponent(Menu, {
  name: "Menu",
  props: {
    children: "slot"
  }
});

PLASMIC.registerComponent(MenuItem, {
  name: "Menu.Item",
  props: {
    label: "slot",
    children: {
      type: "slot",
      allowedComponents: ["Menu.SubMenu"]
    },
    overlay: {
      type: "slot",
      defaultValue: {
        type: "component",
        name: "Menu.Overlay",
      },
      allowedComponents: ["Menu.Overlay"]
    },
    isActive: "boolean",
  },
  parentComponentName: "Menu"
});

PLASMIC.registerComponent(MenuSubMenu, {
  name: "Menu.SubMenu",
  props: {
    items: "slot",
    stretch: "boolean"
  },
  parentComponentName: "Menu.Item"
})

PLASMIC.registerComponent(MenuOverlay, {
  name: "Menu.Overlay",
  props: {
    
  },
  parentComponentName: "Menu.Item"
})

PLASMIC.registerComponent(RegimenController, {
  name: "RegimenController",
  props: {
    selectedRegimen: {
      displayName: "Regimen",
      type: "choice",
      options: (props, ctx) => ctx?.regimens ?? []
    },
    noRegimenSelected: "slot",
    children: "slot"
  }
});

PLASMIC.registerComponent(RegimenProductBundle, {
  name: "RegimenProductBundle",
  props: {
    staticBundleSlot: {
      type: "slot",
      displayName: "staticBundle"
    },
    configurableBundleSlot: {
      type: "slot",
      displayName: "configurableBundle"
    }
  },
  parentComponentName: "RegimenController"
})

PLASMIC.registerComponent(RegimenProductBundleOptions, {
  name: "RegimenProductBundleOptions",
  props: {
    activeOptionSlot: "slot",
    nonActiveOptionSlot: "slot"
  },
  parentComponentName: "RegimenProductBundle"
});


PLASMIC.registerComponent(HeaderMenu, {
  name: "HeaderMenu",
  props: {
    selectedMenu: {
      type: "choice",
      displayName: "Menu name",
      options: (props, ctx) => ctx?.name ?? [],
      defaultValue: "0"
    },
    menuItemSlot: "slot",
    singleSubMenuSlot: "slot",
    subMenuGroupSlot: "slot",
  }
});

registerYouTube(PLASMIC);