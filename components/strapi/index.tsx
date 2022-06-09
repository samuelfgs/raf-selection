import registerComponent, {
    ComponentMeta,
  } from "@plasmicapp/host/registerComponent";
  import registerGlobalContext from "@plasmicapp/host/registerGlobalContext";
  import {
    StrapiCredentialsProvider,
    strapiCredentialsProviderMeta,
    StrapiCollection,
    strapiCollectionMeta,
    StrapiField,
    strapiFieldMeta,
    StrapiRepeatedElement,
    strapiRepeatedElementMeta,
    StrapiLink,
    strapiLinkMeta
  } from "./strapi";
  
  
  export function registerAll(loader?: {
    registerComponent: typeof registerComponent;
    registerGlobalContext: typeof registerGlobalContext;
  }) {
    const _registerComponent = <T extends React.ComponentType<any>>(
      Component: T,
      defaultMeta: ComponentMeta<React.ComponentProps<T>>
    ) => {
      if (loader) {
        loader.registerComponent(Component, defaultMeta);
      } else {
        registerComponent(Component, defaultMeta);
      }
    };
  
    if (loader) {
      loader.registerGlobalContext(StrapiCredentialsProvider, strapiCredentialsProviderMeta);
    } else {
      registerGlobalContext(StrapiCredentialsProvider, strapiCredentialsProviderMeta);
    }
  
    _registerComponent(StrapiCollection, strapiCollectionMeta);
    _registerComponent(StrapiField, strapiFieldMeta);
    _registerComponent(StrapiRepeatedElement, strapiRepeatedElementMeta);
    _registerComponent(StrapiLink, strapiLinkMeta);
  }
  
  export * from "./strapi";