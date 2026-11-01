import fs from "node:fs";
import path from "node:path";

function getWebsiteMarkup() {
  const source = fs.readFileSync(path.join(process.cwd(), "site-template", "index.html"), "utf8");
  const body = source.match(/<body>([\s\S]*?)<\/body>/i)?.[1] ?? "";
  return body.replace(/<script[\s\S]*?<\/script>/gi, "");
}

export default function Home() {
  return <div dangerouslySetInnerHTML={{ __html: getWebsiteMarkup() }} />;
}
