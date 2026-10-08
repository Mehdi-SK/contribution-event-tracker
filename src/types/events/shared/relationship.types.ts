export interface TRelationship<TRelation extends string, TTarget> {
  relation: TRelation
  target: TTarget
}
