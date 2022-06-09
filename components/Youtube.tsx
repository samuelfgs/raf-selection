import { registerComponent, useSelector } from "@plasmicapp/host";
import PlasmicYouTube, { YouTubeProps, youtubeMeta } from "@plasmicpkgs/react-youtube";
import { useStrapiItems } from "./strapi/helper";
import L from "lodash";

function YouTube (props: YouTubeProps & {
  videoIdField?: string,
  setControlContextData?: (data: {
    data: any
  }) => void
}) {
  const { videoIdField, setControlContextData, ...rest } = props;

  const items = useStrapiItems();

  const activeRegimen = useSelector("regimenController")?.activeRegimen;

  setControlContextData?.({ data: items })

  const videoId = L.get(items, videoIdField ?? "");
  
  return videoId && (
    <PlasmicYouTube 
      key={JSON.stringify({videoId, activeRegimen})} 
      {...rest} 
      videoId={videoId}
    />
  )
}

export function registerYouTube(loader: {
  registerComponent: typeof registerComponent
}) {
  const customYoutubeMeta = {
    ...youtubeMeta,
    props: {
      videoIdField: {
        type: "dataSelector",
        data: (props: any, ctx: any) => ctx?.data,
      },
      ...youtubeMeta.props,
      videoId: {
        type: "string",
        hidden: (props: any, ctx: any) => true
      }
    } as any,
  }

  loader.registerComponent(
    YouTube,
    customYoutubeMeta
  );
}