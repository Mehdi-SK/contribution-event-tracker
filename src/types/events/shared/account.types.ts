export interface TAccount<TSystem extends string> {
  system: TSystem
  id: string
  login?: string
}
