// All player-visible text, neutral Latin-American Spanish, single source.
// Values support {name} placeholders filled from core params.

const STRINGS = {
  'ui.title': 'Emprende o Muere',
  'ui.subtitle': 'El juego de las startups',
  'ui.click_to_continue': 'Clic para continuar',
  'ui.game_over': 'Fin de la partida',
  'ui.game_over.survived': 'Sobreviviste 24 meses. Fin de la partida.',
  'ui.game_over.bankrupt': 'Quebraste. Fin de la partida.',
  'month.label': 'Mes {month} de {total}',
  'evt.month_advanced': 'Avanzas al mes {month}.',
  'evt.run_ended': 'Fin de la partida.',

  'hud.focus': 'Acciones',
  'hud.traction': 'Tracción',
  'hud.morale': 'Moral',
  'hud.cash': 'Caja',
  'hud.runway': 'Runway',
  'hud.runway.gloss': 'meses de vida',
  'hud.burn': 'Quema',
  'hud.burn.period': 'mes',
  'hud.team': 'Equipo',
  'hud.energy': 'Energía',
  'hud.founder': 'Founder',
  'ui.stamp.survived': 'SOBREVIVISTE',
  'ui.stamp.bankrupt': 'QUEBRASTE',

  'action.BUILD_PRODUCT': 'Construir producto',
  'action.BURNED.desc': 'Tracción +0 · Moral −{moraleCost}',
  'action.LABOR.desc': 'Tracción {range} · Moral −{moraleCost}{lowTag}',
  'action.LABOR.low': '· moral baja',
  'action.HIRE.perk': '{base} · {perk}',
  'action.HIRE.perk.VENTAS': 'Firmar cliente: {from} → {to} trac',
  'action.HIRE.perk.CTO': 'Construir: {from} → {to} trac',
  'action.HIRE.perk.CFO': 'Facturas: {from}m → {to}m',
  'action.HIRE.perk.CPO': 'Hablar: {from} → {to} trac',
  'action.BUILD_PRODUCT.desc': 'Tracción +8 · Moral −8',
  'action.TALK_TO_CUSTOMERS': 'Hablar con clientes',
  'action.TALK_TO_CUSTOMERS.desc': 'Tracción +6 · Moral −5',
  'action.PUBLISH_CONTENT': 'Publicar contenido',
  'action.PUBLISH_CONTENT.desc': 'Tracción +4 · Moral −3',
  'action.REST': 'Descansar',
  'action.REST.desc': 'Moral +15 · Energía +25',
  'action.CLOSE_CLIENT': 'Firmar cliente',
  'action.CLOSE_CLIENT.desc': 'Tracción −{closeCost} · Factura ${amountK}k en {delay}m',
  'action.HIRE': 'Contratar {role} · ${signOnK}k + {salaryK}k/mes',
  'action.HIRE.desc': 'Burn sube a {newBurnK}k/mes',
  'action.PITCH': 'Pitch a inversores',
  'action.PITCH.desc': 'Energía −{cost} · desde mes {minMonth} · Valor (Pre) actual: ${preK}k',
  'action.END_MONTH': 'Cerrar mes',
  'action.END_MONTH.desc': 'Caja −{burn}k · moral −{decayLo} a −{decayHi}',

  'ui.offer.title': 'Oferta de inversión',
  'ui.offer.terms': 'Pre ${preK}k · Ronda ${roundK}k',
  'ui.offer.dilution': 'Inversores {investorPct}% · Te queda {founderPct}%',
  'ui.offer.accept': 'Aceptar',
  'ui.offer.decline': 'Rechazar',
  'ui.offer.counter': 'Negociar',
  'ui.offer.counter.label': 'Negociar (−{cost})',
  'ui.offer.counter.desc': 'Energía −{cost} · riesgo de perder al inversor',
  'ui.offer.countered': 'Términos mejorados',
  'ui.offer.risk': 'Negociar cuesta {cost} de energía · 1 de 4 veces el inversor se levanta',

  'reason.focus': 'Sin acciones este mes: cerrá para recuperarlas',
  'ui.warn.burned': 'Equipo quemado: esto no sube tracción. Descansá.',
  'reason.CLOSE_CLIENT': 'Requiere {cost} de tracción',
  'reason.HIRE': 'Faltan ${missing}k para la entrada',
  'reason.PITCH_month': 'Se destraba en el mes {month}',
  'reason.PITCH_cooldown': 'En pausa: vuelve en {months} meses',
  'reason.PITCH_energy': 'Necesitás {gate} de energía',
  'ui.offer.counter.reason.energy': 'Faltan {cost} de energía para negociar',

  'role.VENTAS': 'Ventas',
  'role.CTO': 'CTO',
  'role.CFO': 'CFO',
  'role.CPO': 'CPO',
  'role.all_hired': 'Equipo completo',

  'ui.library.title': 'Lo que aprendiste',
  'ui.library.unknown': '??? aún no lo descubriste',
  'ui.library.close': 'Cerrar',
  'ui.close': 'Cerrar',
  'ui.restart': 'Jugar otra vez',
  'ui.library.button': 'Biblioteca',
  'ui.help.button': '?',
  'ui.help.title': '¿Cómo se juega?',
  'ui.help.col.metrics': 'Métricas',
  'ui.help.col.actions': 'Acciones',
  'ui.help.col.rules': 'Reglas',
  'ui.help.hint': '¿Nuevo aquí? Pulsa ? para una guía rápida.',

  'learning.first_bankrupt': 'Te quedaste sin caja y quebraste. El burn manda: conoce tu runway antes de gastar.',
  'learning.first_hire': 'Contrataste a alguien. Sueldo significa burn permanente: cada mes, pase lo que pase.',
  'learning.first_round': 'Levantaste tu primera ronda. El dinero entró, pero una parte de tu empresa ya no es tuya.',
  'learning.drained_deal': 'Aceptaste una ronda hecho polvo. Un fundador quemado firma términos baratos: descansa antes de pitchear.',
  'learning.investor_walked': 'Negociaste y el inversor se levantó. Forzar de más a veces cuesta la ronda entera.',
  'learning.offer_expired': 'Dejaste una oferta morir sin responder. Los inversores no esperan: decide cuando la tengas enfrente.',
  'learning.broke_while_funded': 'Quebraste teniendo inversores. El dinero de la ronda también es burn: financiar no es sobrevivir.',
  'learning.lost_control_survivor': 'Sobreviviste, pero perdiste el control. La caja de la empresa ya no era tuya: saliste casi sin nada.',

  'evt.action_taken': 'Hiciste {action}.',
  'evt.action_taken.BUILD_PRODUCT': 'Construiste producto: tracción {tractionDelta}, moral {moraleDelta}.',
  'evt.action_taken.TALK_TO_CUSTOMERS': 'Hablaste con clientes: tracción {tractionDelta}, moral {moraleDelta}.',
  'evt.action_taken.PUBLISH_CONTENT': 'Publicaste contenido: tracción {tractionDelta}, moral {moraleDelta}.',
  'evt.action_taken.REST': 'El equipo descansó: moral {moraleDelta}.',
  'evt.action_taken.CLOSE_CLIENT': 'Firmaste un cliente: tracción {tractionDelta}.',
  'evt.action_taken.HIRE': 'Contrataste a {role} ({cashDelta}k).',
  'evt.action_taken.END_MONTH': 'Cierra el mes. Moral {moraleDelta}.',
  'evt.invoice_created': 'Firma: factura ${amountK}k para el mes {dueMonth}.',
  'evt.invoice_paid': 'Cliente pagó: +${amountK}k.',
  'evt.salaries_paid': 'Planillas: −${amountK}k.',
  'evt.offer_made': 'Oferta: pre ${preK}k, ${roundK}k por {investorPct}% de la empresa.',
  'evt.round_closed': 'Ronda cerrada: +${roundK}k. Eres {founderPct}% de tu empresa.',
  'evt.offer_declined': 'Rechazaste la oferta.',
  'evt.offer_expired': 'La oferta expiró sin respuesta.',
  'evt.offer_countered': 'Negociaste: {investorPct}% por ${roundK}k.',
  'evt.offer_walked': 'El inversor se levantó de la mesa.',
  'evt.run_ended.survived': 'Sobreviviste 24 meses. Fin de la partida.',
  'ui.exit.valuation': 'Valor de salida: ${valuationK}k',
  'ui.exit.payout': 'Tu {founderPct}% vale ${payoutK}k',
  'ui.exit.cashout': 'Conservaste el control: +${cashOutK}k de caja',
  'ui.exit.lost_control': 'Perdiste el control: la caja se queda en la empresa',
  'ui.exit.personal': 'Patrimonio personal: ${personalK}k',
  'evt.run_ended.bankrupt': 'Quebraste en el mes {month}. Fin de la partida.',
};

Object.freeze(STRINGS);

/**
 * @param {string} key
 * @returns {boolean}
 */
export function hasString(key) {
  return Object.prototype.hasOwnProperty.call(STRINGS, key);
}

/**
 * Look up a string by key; throws on missing keys (loud in dev).
 * @param {string} key
 * @returns {string}
 */
export function getString(key) {
  const value = STRINGS[key];
  if (value === undefined) {
    throw new Error(`Missing string key: ${key}`);
  }
  return value;
}

/**
 * Fill `{name}` placeholders from params; throws if a placeholder has no param.
 * @param {string} template
 * @param {Readonly<Record<string, string | number>>} [params]
 * @returns {string}
 */
export function format(template, params = {}) {
  return template.replace(/\{(\w+)\}/g, (match, name) => {
    const value = params[name];
    if (value === undefined) {
      throw new Error(`Missing param "${name}" for template "${template}"`);
    }
    return String(value);
  });
}

const HELP_SECTIONS = Object.freeze({
  metrics: Object.freeze([
    'Acciones: puntos de acción al mes (2)',
    'Tracción: interés del mercado',
    'Moral: ánimo; bajo, menos rinde',
    'Caja: plata de la empresa',
    'Runway: meses de vida',
    'Burn: gasto mensual',
    'Energía: vigor; el pitch gasta',
    'Founder: tu % de propiedad',
    'Equipo: tu gente y su sueldo',
  ]),
  actions: Object.freeze([
    'Construir producto: +8 tracción · −8 moral',
    'Hablar clientes: +6 tracción · −5 moral',
    'Publicar contenido: +4 tracción · −3 moral',
    'Descansar: +15 moral · +25 energía',
    'Firmar: −10 tracción, cobra en 3 meses',
    'Contratar: +sueldo mensual',
    'Pitch: inversores (Pre=valor)',
    'Cerrar mes: sigue el mes',
  ]),
  rules: Object.freeze([
    'Cada acción varía ±3 tracción',
    'Moral 67+: rinde pleno',
    'Moral 34–66: rinde a la mitad',
    'Moral <34: 0 tracción; Descansar sube +15',
    'Pitch: mes 6+, energía, cooldown',
    'Negociar: 20 energía, puede irse',
    'Contratar: plata de entrada',
    'Firmar: requiere 10 tracción',
  ]),
});

/**
 * Legend lines for the help screen, grouped by section. Static copy (no
 * placeholders) so the screen renders a plain loop over already-translated
 * lines. Adding a mechanic means adding an entry, not new render code.
 * @returns {Readonly<Record<'metrics' | 'actions' | 'rules', ReadonlyArray<string>>>}
 */
export function getHelpSections() {
  return HELP_SECTIONS;
}
