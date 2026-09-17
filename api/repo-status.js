// @ts-check

const relativeTime = (iso) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days}j`;
  const months = Math.floor(days / 30);
  if (months < 12) return `il y a ${months} mois`;
  return `il y a ${Math.floor(months / 12)} an(s)`;
};

const escapeXml = (s) =>
  String(s).replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c])
  );

// @ts-ignore
export default async (req, res) => {
  const { repo, bg_color = "ffffff", text_color = "333333", accent_color = "0969da" } = req.query;

  if (!repo || !repo.includes("/")) {
    res.setHeader("Content-Type", "text/plain");
    res.status(400).send("Missing or invalid 'repo' param, expected owner/name");
    return;
  }

  const token = process.env.PAT_1;
  const ghRes = await fetch(`https://api.github.com/repos/${repo}`, {
    headers: token ? { Authorization: `token ${token}` } : {},
  });

  if (!ghRes.ok) {
    res.setHeader("Content-Type", "text/plain");
    res.status(ghRes.status).send(`GitHub API error: ${ghRes.status}`);
    return;
  }

  const data = await ghRes.json();
  const branch = data.default_branch;
  const when = relativeTime(data.pushed_at);
  const text = `↻ ${repo} — pushé ${when}, sur ${branch}`;

  const charWidth = 7.1;
  const width = Math.round(text.length * charWidth) + 20;
  const height = 24;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" role="img" aria-label="${escapeXml(text)}">
  <rect width="100%" height="100%" fill="#${bg_color}" rx="4"/>
  <text x="10" y="16" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="13" fill="#${text_color}">${escapeXml(`↻ ${repo} — pushé ${when}, sur `)}<tspan fill="#${accent_color}">${escapeXml(branch)}</tspan></text>
</svg>`;

  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "max-age=300, s-maxage=300");
  res.status(200).send(svg);
};
