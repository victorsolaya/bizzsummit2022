import { XrmMockGenerator } from "xrm-mock";
import { SetupGlobalContext } from "dataverse-ify/lib/webapi";
import { Contact, contactMetadata } from
    "../../dataverse-gen/entities/Contact";
import { Account, accountMetadata } from "../../dataverse-gen/entities/Account";
import { AccountRibbon } from "../AccountRibbon";
import { metadataCache } from "../../dataverse-gen/metadata";
import { Entity, setMetadataCache, XrmContextCdsServiceClient } from "dataverse-ify";

describe("AccountRibbon", () => {
    beforeEach(async () => {
        XrmMockGenerator.initialise();
        await SetupGlobalContext();
        setMetadataCache(metadataCache);
        Xrm.Utility.showProgressIndicator = jest.fn();
        Xrm.Utility.closeProgressIndicator = jest.fn();

    });

    it("creates a new contact", async () => {
        const serviceClient = new XrmContextCdsServiceClient(Xrm.WebApi);
        //Arrange
        const accountEntity: Account = {
            logicalName: accountMetadata.logicalName,
            name: "Account Integration test"
        } as Account

        const contactEntity: Contact = {
            logicalName: contactMetadata.logicalName,
            firstname: "Victor",
            lastname: "Sanchez"
        } as Contact

        try {
            accountEntity.id = await serviceClient.create(accountEntity);
            contactEntity.parentcustomerid = Entity.toEntityReference(accountEntity);
            //Act
            const contactid = await AccountRibbon.CreateContactWithAccountFunctionality(serviceClient, contactEntity)
            contactEntity.id = contactid;
            const contactCreated: Contact = await serviceClient.retrieve(contactMetadata.logicalName, contactEntity.id, true )
            //Assert

            expect(contactCreated.firstname).toBe("Victor")
            expect(contactCreated.lastname).toBe("Sanchez")
            expect(contactCreated.parentcustomerid.id).toBe(accountEntity.id)
            expect(contactCreated.parentcustomerid.name).toBe(accountEntity.name)
        }
        catch(ex) {
            console.error(ex.message);
            throw Error(ex.message);
        }
        finally {
            if(contactEntity.id) {
                await serviceClient.delete(contactEntity);
            }
            if(accountEntity.id) {
                await serviceClient.delete(accountEntity);
            }
        }
    }, 100000)
})