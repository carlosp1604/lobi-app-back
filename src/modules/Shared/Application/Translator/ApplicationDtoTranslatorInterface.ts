export interface ApplicationDtoTranslatorInterface<DomainType, DtoType> {
  translate(domain: DomainType): DtoType
}
