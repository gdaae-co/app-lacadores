#!/usr/bin/env node
/*
 * migrar-precos.js
 * ----------------
 * Converte um backup JSON do app ANTIGO (cada item tem um "preco" cheio e
 * cada plano tem um "% de desconto") para o modelo NOVO (cada item guarda
 * um preço fixo por plano: naoAssinante / padawan / cavaleiro / mestre).
 *
 * O preço de cada plano é calculado a partir do valor cheio menos o % que
 * aquele plano tinha — ou seja, dá exatamente o mesmo valor efetivo que o
 * app antigo cobrava hoje. É só o PONTO DE PARTIDA: depois você abre o app
 * novo e ajusta na mão os itens que quiser com preço diferente.
 *
 * USO:
 *   node migrar-precos.js backup_antigo.json > backup_novo.json
 *
 * Depois, no app novo: Admin → Dados do Sistema → "Importar Backup JSON".
 */

const fs = require('fs');

const arq = process.argv[2];
if (!arq) {
  console.error('Uso: node migrar-precos.js <backup_antigo.json> > backup_novo.json');
  process.exit(1);
}

let db;
try {
  db = JSON.parse(fs.readFileSync(arq, 'utf8'));
} catch (e) {
  console.error('Não consegui ler/parsear o arquivo:', e.message);
  process.exit(1);
}

// % de desconto de cada plano no backup antigo (default 0 se faltar)
const P = db.PLANOS || {};
const pct = (k) => Number(P[k] && P[k].pct) || 0;

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

let convertidos = 0, jaNovos = 0;

db.itens = (db.itens || []).map((i) => {
  // Se já está no formato novo, não mexe.
  if (i.precos) { jaNovos++; return i; }

  const base = Number(i.preco) || 0;
  const precos = {
    naoAssinante: r2(base),
    padawan:      r2(base * (1 - pct('padawan')   / 100)),
    cavaleiro:    r2(base * (1 - pct('cavaleiro') / 100)),
    mestre:       r2(base * (1 - pct('mestre')    / 100)),
  };
  convertidos++;

  const { preco, ...resto } = i; // remove o campo "preco" antigo
  return { ...resto, precos };
});

// No modelo novo os planos não têm mais "pct"; mantemos só rótulo/badge.
if (db.PLANOS) {
  const badge = { padawan: 'p', cavaleiro: 'c', mestre: 'm' };
  const novo = {};
  for (const k of ['padawan', 'cavaleiro', 'mestre']) {
    const antigo = db.PLANOS[k] || {};
    novo[k] = {
      label: antigo.label || (k.toUpperCase() + ' GDAAE'),
      badge: antigo.badge || badge[k],
    };
  }
  db.PLANOS = novo;
}

process.stderr.write(`Itens convertidos: ${convertidos} | já no formato novo: ${jaNovos}\n`);
process.stdout.write(JSON.stringify(db, null, 2));
