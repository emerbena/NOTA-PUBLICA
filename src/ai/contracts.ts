export type ResearchTask =
  'research' | 'sources' | 'deduplicate' | 'draft' | 'classify' | 'headline';
export interface EditorialProposal {
  task: ResearchTask;
  title: string;
  body: string;
  sources: { url: string; name: string }[];
  runId: string;
}
export interface ProposalProvider {
  propose(input: { task: ResearchTask; instructions: string }): Promise<EditorialProposal>;
}
// Contrato sin aprobación/publicación: las propuestas serán revisiones en borrador.
// Un proveedor IA nunca recibe Actor ni un token de sesión de un publicador.
