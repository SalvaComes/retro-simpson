export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-bold text-simpsonBlue">Retro Simpsons 🍩</h1>
      <p className="max-w-md text-simpsonBrown/80">
        Esta página no se usa directamente. Los miembros del equipo acceden con
        el enlace de sesión que comparte el administrador (
        <code className="rounded bg-simpsonYellow/40 px-1">/session/&lt;id&gt;</code>
        ), y el administrador entra por{" "}
        <code className="rounded bg-simpsonYellow/40 px-1">/admin/login</code>.
      </p>
    </main>
  );
}
