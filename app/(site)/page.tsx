import fs from "node:fs";
import path from "node:path";
import { renderFeaturedProject, renderProjectSection } from "../../lib/site/render-projects";

function getWebsiteMarkup() {
  const source = fs.readFileSync(path.join(process.cwd(), "site-template", "index.html"), "utf8");
  const body = source.match(/<body>([\s\S]*?)<\/body>/i)?.[1] ?? "";
  const markup = body.replace(/<script[\s\S]*?<\/script>/gi, "");
  for (const marker of ["<!-- defaultstackr -->", "<!-- site-projects -->"]) {
    if (!markup.includes(marker)) {
      throw new Error(`site-template/index.html mist ${marker}`);
    }
  }
  return markup
    .replace("<!-- defaultstackr -->", renderFeaturedProject())
    .replace("<!-- site-projects -->", renderProjectSection());
}

export default function Home() {
  return <div dangerouslySetInnerHTML={{ __html: getWebsiteMarkup() }} />;
}
