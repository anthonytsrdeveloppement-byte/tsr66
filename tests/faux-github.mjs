// Faux GitHub pour tester la garde de mise en ligne sans réseau : chargé avant
// la garde (node --import), il remplace fetch. Réponses lues dans FAUX_GITHUB :
//   { "injoignable": true }  → erreur réseau
//   { "reponses": { "<chemin>": { "status", "corps", "texte", "entetes" } } }
// Une adresse inconnue (autre dépôt, autre chemin) reçoit un 404 : la garde
// n'est acceptée que si elle n'interroge que les adresses prévues.

const DEPOT = "https://api.github.com/repos/anthonytsrdeveloppement-byte/tsr66";
const scenario = JSON.parse(process.env.FAUX_GITHUB ?? "{}");

globalThis.fetch = async (adresse) => {
  if (scenario.injoignable) throw new TypeError("fetch failed");
  const texte = String(adresse);
  const reponse = texte.startsWith(DEPOT)
    ? scenario.reponses?.[texte.slice(DEPOT.length)]
    : undefined;
  if (!reponse) return new Response("{}", { status: 404 });
  return new Response(reponse.texte ?? JSON.stringify(reponse.corps ?? {}), {
    status: reponse.status ?? 200,
    headers: reponse.entetes,
  });
};
