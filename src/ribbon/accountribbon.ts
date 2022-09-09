import {
    CdsServiceClient,
    EntityCollection,
    EntityReference,
    setMetadataCache, XrmContextCdsServiceClient,
} from "dataverse-ify";
import { Contact, ContactAttributes } from "../dataverse-gen/entities/Contact";

import { metadataCache } from "../dataverse-gen/metadata";

export class AccountRibbon {
    static async CreateContactWithAccount(formContext: Xrm.FormContext): Promise<void> {
        const serviceClient = new XrmContextCdsServiceClient(Xrm.WebApi);

        const accountEntityReference: EntityReference = {
            entityType: formContext.data.entity.getEntityName(),
            id: formContext.data.entity.getId(),
            name: formContext.getAttribute("name").getValue()
        }

        const contactEntity: Contact = {
            logicalName: "contact",
            firstname: "Victor",
            lastname: "Sanchez",
            parentcustomerid: accountEntityReference
        } as Contact
        const contactid = AccountRibbon.CreateContactWithAccountFunctionality(serviceClient, contactEntity);
    }

    static async CreateContactWithAccountFunctionality(serviceClient: XrmContextCdsServiceClient, contactEntity: Contact): Promise<string> {
        Xrm.Utility.showProgressIndicator("Creating...");
        const contactid = await serviceClient.create(contactEntity);
        Xrm.Utility.closeProgressIndicator();
        return contactid
    }
}