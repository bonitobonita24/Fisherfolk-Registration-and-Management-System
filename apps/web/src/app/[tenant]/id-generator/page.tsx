import { auth } from "@/server/auth";
import { TemplateEditor } from "./_components/template-editor";

export default async function IdGeneratorPage() {
  const session = await auth();
  const role = session?.user?.role;
  const canManage = role === "super_admin" || role === "admin";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">ID Generator</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Design fisherfolk identification card templates with drag-and-drop editor.
        </p>
      </div>
      <TemplateEditor canManage={canManage} />
    </div>
  );
}
