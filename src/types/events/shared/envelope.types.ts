export interface TEventEnvelope<TType extends string, TData> {
  specversion: '1.0'
  id: string
  source: string
  type: TType
  subject: string
  time: string
  datacontenttype: 'application/json'
  dataschema: string
  data: TData
}
export interface TAnyEventEnvelope extends TEventEnvelope<string, unknown> {}
