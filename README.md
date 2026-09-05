# RJUTA website

Production-ready static website for **RJUTA — Simply Better.**

## Publish with GitHub Pages (current interface)

1. Create a **public** repository named `rjuta-website` (GitHub Free requires a public repository for Pages).
2. Upload all site files to the repository root and commit them to `main`. `index.html` must be at the root—not inside another folder.
3. Open the repository, then **Settings → Code and automation → Pages**.
4. Under **Build and deployment** set:
   - **Source:** `Deploy from a branch`
   - **Branch:** `main`
   - **Folder:** `/ (root)`
   - Select **Save**.
5. Wait for the Pages screen to show **Your site is live at…**. The first deployment may take several minutes.
6. Before changing DNS, verify the purchased domain under **profile picture → Settings → Code, planning, and automation → Pages → Add a domain**. GitHub provides a unique DNS `TXT` record. Add it at the registrar, keep it permanently, then select **Verify** on GitHub.
7. Return to the repository's **Settings → Pages**. Under **Custom domain**, enter the preferred hostname (for example `www.example.com`) and select **Save**.
8. Add the DNS records below. Do not alter existing email `MX` or email-verification `TXT` records.
9. When GitHub's DNS check succeeds and the certificate is ready, select **Enforce HTTPS**.
10. Replace `YOUR-DOMAIN` in `robots.txt` and `sitemap.xml`, and update the contact email in `index.html`.

## Typical DNS records

For the root/apex domain, add these `A` records:

| Type | Host | Value |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

For `www`, add:

| Type | Host | Value |
| --- | --- | --- |
| CNAME | www | `YOUR-GITHUB-USERNAME.github.io` |

Do not remove existing MX/TXT records used for email. DNS changes can take time to propagate.

## Security checklist

- Turn on two-factor authentication for the GitHub account; prefer a passkey or security key and store recovery codes offline.
- Verify the custom domain in account settings before pointing DNS to GitHub.
- Never use wildcard DNS records such as `*.example.com`.
- Keep the GitHub domain-verification TXT record permanently.
- Enable **Enforce HTTPS** after certificate provisioning completes.
- Under **Settings → General → Pull Requests**, require review before merging if collaborators will edit the site.
- Under **Settings → Collaborators**, grant access only to people who need it.
- Under **Settings → Actions → General**, keep the default restricted permissions; this site does not require a custom Actions workflow.
- Never commit passwords, registrar credentials, API keys, customer data, or private documents. GitHub Pages content is public.
- Enable Dependabot alerts if dependencies are added later. The current site has no package dependencies.
- Do not add forms that collect passwords, payment details, or other sensitive information to GitHub Pages.
