export interface DtoTranslatorInterface<DataType, DtoType> {
  translate(data: DataType): DtoType
}
