import { createApiRoot } from "../client/create.client";
import { AttributeSchema, CustomObject, CustomObjectDraft, Schema } from "../types/validator";


const SCHEMA_CONTAINER = 'mc-custom-object-schema';
export class CustomObjectController {

  async fetchCustomObject(container: string, key: string): Promise<CustomObject | null> {
    try {
      const response = await createApiRoot().customObjects()
        .withContainerAndKey({ container, key })
        .get()
        .execute();
      return response.body;
    } catch (error) {
      console.error('Error fetching custom object:', error);
      return null;
    }
  }

  async createOrUpdateCustomObject(
    container: string,
    key: string,
    value: Record<string, any>,
    schemaType: string
  ): Promise<CustomObject> {
    await this.validateObjectSchema(value, schemaType);

    const draft: CustomObjectDraft = {
      container,
      key,
      value
    };

    const response = await createApiRoot().customObjects()
      .post({
        body: draft
      })
      .execute();

    return response.body;
  }

  private async validateObjectSchema(value: Record<string, any>, schemaType: string): Promise<void> {
    if (schemaType === SCHEMA_CONTAINER) {
      return;
    }
    const schemaObject = await this.fetchCustomObject(SCHEMA_CONTAINER, schemaType);
    if (!schemaObject) {
      throw new Error(`Schema not found for type: ${schemaType}`);
    }

    const schema = schemaObject.value as Schema;

    for (const attributeSchema of schema.attributes) {
      const attributeValue = value[attributeSchema.name];
      
      if (attributeSchema.required && attributeValue === undefined) {
        throw new Error(`Required attribute missing: ${attributeSchema.name}`);
      }

      if (attributeValue != null) {
        await this.validateAttribute(attributeSchema, attributeValue);
      }
    }
  }

  private async validateAttribute(schema: AttributeSchema, value: any): Promise<void> {
    switch (schema.type) {
      case 'Boolean':
        await this.validateBoolean(schema, value);
        break;
      case 'String':
        await this.validateString(schema, value);
        break;
      case 'Number':
        await this.validateNumber(schema, value);
        break;
      case 'Date':
        await this.validateDate(schema, value);
        break;
      case 'Enum':
        await this.validateEnum(schema, value);
        break;
      case 'Reference':
        await this.validateReference(schema, value);
        break;
      default:
        throw new Error(`Unsupported type for attribute: ${schema.name}`);
    }
  }

  private async validateBoolean(schema: AttributeSchema, value: any): Promise<void> {
    if (typeof value !== 'boolean') {
      throw new Error(`Invalid type for attribute: ${schema.name}. Expected Boolean, got ${typeof value}`);
    }
  }

  private async validateString(schema: AttributeSchema, value: any): Promise<void> {
    if (typeof value !== 'string') {
      throw new Error(`Invalid type for attribute: ${schema.name}. Expected String, got ${typeof value}`);
    }
  }

  private async validateNumber(schema: AttributeSchema, value: any): Promise<void> {
    if (typeof value !== 'number') {
      throw new Error(`Invalid type for attribute: ${schema.name}. Expected Number, got ${typeof value}`);
    }
  }

  private async validateDate(schema: AttributeSchema, value: any): Promise<void> {
    if (typeof value !== 'string') {
      throw new Error(`Invalid type for attribute: ${schema.name}. Expected Date string, got ${typeof value}`);
    }
  }

  private async validateEnum(schema: AttributeSchema, value: any): Promise<void> {
    if (typeof value !== 'string') {
      throw new Error(`Invalid type for enum attribute: ${schema.name}. Expected String, got ${typeof value}`);
    }
    
    if (!schema.enum?.some(enumValue => enumValue.value === value)) {
      throw new Error(`Invalid enum value for attribute: ${schema.name}. Value: ${value}`);
    }
  }

  private async validateReference(schema: AttributeSchema, value: any): Promise<void> {
    if (typeof value !== 'object' || value === null) {
      throw new Error(`Invalid type for reference attribute: ${schema.name}. Expected object, got ${typeof value}`);
    }

    const referenceValue = value as Record<string, unknown>;
    const typeId = referenceValue.typeId as string;
    const id = referenceValue.id as string;
    const key = referenceValue.key as string;

    if (!typeId || (!id && !key)) {
      throw new Error(`Invalid reference value for attribute: ${schema.name}. Missing typeId or id/key`);
    }

    if (!schema.reference || typeId !== schema.reference.type) {
      throw new Error(
        `Invalid reference type for attribute: ${schema.name}. Expected ${schema.reference?.type}, got ${typeId}`
      );
    }
  }
}