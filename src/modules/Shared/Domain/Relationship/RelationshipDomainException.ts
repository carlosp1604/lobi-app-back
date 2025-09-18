import { DomainException } from '~/src/modules/Exception/Domain/DomainException'

export class RelationshipDomainException extends DomainException {
  public static relationNotLoadedId = 'relationship_relation_not_loaded'
  public static cannotDeleteRelationId = 'relationship_cannot_delete_relation'

  constructor(message: string, id: string) {
    super(message, id, RelationshipDomainException.name)
  }

  public static relationNotLoaded(): RelationshipDomainException {
    return new RelationshipDomainException('Relation not loaded', this.relationNotLoadedId)
  }

  public static cannotDeleteRelation(): RelationshipDomainException {
    return new RelationshipDomainException('Cannot delete relation', this.cannotDeleteRelationId)
  }
}
