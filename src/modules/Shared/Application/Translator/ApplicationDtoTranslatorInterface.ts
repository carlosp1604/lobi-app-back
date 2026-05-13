export interface ApplicationDtoTranslatorInterface<DataType, DtoType> {
  translate(data: DataType): DtoType
}
