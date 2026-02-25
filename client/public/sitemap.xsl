<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9">

  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Sitemap - TruckerTools</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f8fafc; color: #1e293b; }
          .header { background: #1e293b; color: #fff; padding: 24px 32px; }
          .header h1 { font-size: 20px; font-weight: 600; letter-spacing: -0.3px; }
          .header p { font-size: 13px; color: #94a3b8; margin-top: 4px; }
          .container { max-width: 900px; margin: 32px auto; padding: 0 16px; }
          .stats { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
          .stat { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 20px; }
          .stat-num { font-size: 24px; font-weight: 700; color: #0f172a; }
          .stat-label { font-size: 12px; color: #64748b; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
          thead tr { background: #f1f5f9; }
          th { text-align: left; padding: 11px 16px; font-size: 12px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; }
          td { padding: 11px 16px; font-size: 13px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
          tr:last-child td { border-bottom: none; }
          tr:hover td { background: #f8fafc; }
          a { color: #2563eb; text-decoration: none; word-break: break-all; }
          a:hover { text-decoration: underline; }
          .priority-badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 600; }
          .p-high { background: #dcfce7; color: #166534; }
          .p-med { background: #fef9c3; color: #854d0e; }
          .p-low { background: #f1f5f9; color: #475569; }
          .date { color: #64748b; white-space: nowrap; }
          .footer { text-align: center; font-size: 12px; color: #94a3b8; margin: 24px 0 48px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>TruckerTools Sitemap</h1>
          <p>XML Sitemap — <a href="/sitemap.xml" style="color:#93c5fd;">sitemap.xml</a></p>
        </div>
        <div class="container">
          <div class="stats">
            <div class="stat">
              <div class="stat-num"><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></div>
              <div class="stat-label">Total URLs</div>
            </div>
            <div class="stat">
              <div class="stat-num"><xsl:value-of select="count(sitemap:urlset/sitemap:url[sitemap:lastmod])"/></div>
              <div class="stat-label">With last modified date</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>URL</th>
                <th>Priority</th>
                <th>Last Modified</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <xsl:variable name="priority" select="sitemap:priority"/>
                <tr>
                  <td style="color:#94a3b8;width:40px;"><xsl:value-of select="position()"/></td>
                  <td>
                    <a href="{sitemap:loc}">
                      <xsl:value-of select="sitemap:loc"/>
                    </a>
                  </td>
                  <td>
                    <xsl:choose>
                      <xsl:when test="number($priority) >= 0.8">
                        <span class="priority-badge p-high"><xsl:value-of select="$priority"/></span>
                      </xsl:when>
                      <xsl:when test="number($priority) >= 0.5">
                        <span class="priority-badge p-med"><xsl:value-of select="$priority"/></span>
                      </xsl:when>
                      <xsl:otherwise>
                        <span class="priority-badge p-low"><xsl:value-of select="$priority"/></span>
                      </xsl:otherwise>
                    </xsl:choose>
                  </td>
                  <td class="date">
                    <xsl:value-of select="sitemap:lastmod"/>
                  </td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
          <div class="footer">
            Generated dynamically · <a href="https://www.sitemaps.org/protocol.html">Sitemap Protocol</a>
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
