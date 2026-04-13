export const setupRouter = (pages: any[]) => {
  const nav = document.getElementById("nav")!;
  const page = document.getElementById("page")!;

  pages.forEach(p => {
    const btn = document.createElement("button");
    btn.textContent = p.label;

    btn.onclick = async () => {
      const mod = await import(`../components/${p.id}.ts`);
      page.innerHTML = "";
      mod.render(page);
    };

    nav.appendChild(btn);
  });
}