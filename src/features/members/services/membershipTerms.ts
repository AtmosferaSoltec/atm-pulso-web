export interface TermsClause {
  title: string;
  body: string;
}

/**
 * Template clauses printed on every membership receipt. They are a starting point:
 * each gym should review them (ideally with a lawyer) before using them for real.
 */
export const membershipTerms: TermsClause[] = [
  { title: 'Uso personal', body: 'La membresía es personal e intransferible. El ingreso se valida con el documento de identidad registrado; prestar o compartir el acceso puede causar la suspensión.' },
  { title: 'Salud y aptitud física', body: 'El socio declara estar apto para realizar actividad física y se compromete a informar cualquier condición médica. Se recomienda una evaluación médica previa. Los menores de edad requieren autorización escrita de su apoderado.' },
  { title: 'Seguridad en las instalaciones', body: 'Debe seguir las indicaciones del personal, usar los equipos de forma adecuada, vestir ropa y calzado deportivo y mantener limpios los espacios. El gimnasio no responde por lesiones derivadas del mal uso de equipos o del incumplimiento de las indicaciones.' },
  { title: 'Reglamento y convivencia', body: 'Está prohibido ingresar bajo efectos del alcohol o drogas, portar armas, grabar a otras personas sin su consentimiento o mantener conductas que perturben a los demás. El incumplimiento puede ocasionar la suspensión o cancelación de la membresía sin derecho a devolución.' },
  { title: 'Objetos personales', body: 'Use los casilleros bajo su responsabilidad. El gimnasio no se hace responsable por la pérdida, robo o daño de objetos personales. Las áreas comunes cuentan con videovigilancia.' },
  { title: 'Pago y vigencia', body: 'La membresía se paga por adelantado y rige únicamente entre las fechas indicadas. No se extiende ni se compensa por días de inasistencia. La renovación genera una nueva boleta.' },
  { title: 'Reembolsos', body: 'Los pagos no son reembolsables ni transferibles por inasistencia o decisión personal. Solo se evaluará una devolución proporcional por cierre definitivo de la sede, por un error de cobro o por una causa médica acreditada con certificado.' },
  { title: 'Acceso a sedes', body: 'La membresía permite ingresar únicamente a las sedes indicadas en esta boleta, sujeto al aforo y a los horarios de cada sede.' },
  { title: 'Datos personales', body: 'Los datos del socio se usan para gestionar la membresía y el control de acceso, conforme a la Ley N.º 29733 de Protección de Datos Personales. Puede solicitar su actualización o eliminación al gimnasio.' },
];
