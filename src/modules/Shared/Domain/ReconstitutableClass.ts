export interface ReconstitutableClass<InstanceType, PrimitivesType> {
  fromPrimitives(primitives: PrimitivesType): InstanceType
}
