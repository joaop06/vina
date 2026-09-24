import "./classic.css";
import { ClassicFooter } from "./ClassicFooter";
import { ClassicHeader } from "./ClassicHeader";
import { ClassicHome } from "./ClassicHome";
import { ClassicNotFound } from "./ClassicNotFound";
import { ClassicPreview } from "./ClassicPreview";
import type { SiteLayoutModule } from "../contract/types";

export { ClassicFooter, ClassicHeader, ClassicHome, ClassicNotFound };

export const classicLayout: SiteLayoutModule = {
  id: "classic",
  Header: ClassicHeader,
  Footer: ClassicFooter,
  Home: ClassicHome,
  NotFound: ClassicNotFound,
  Preview: ClassicPreview,
};
