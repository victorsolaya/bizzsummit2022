import {
    AccountForm
} from "../AccountForm";
import {
    XrmMockGenerator
} from "xrm-mock";

describe("AccountForm.OnLoad", () => {
    beforeEach(() => {
        XrmMockGenerator.initialise();
    });

    
    it("shows alert when change of name", () => {
        const context = XrmMockGenerator.getEventContext();
        const nameFieldMock = XrmMockGenerator.Attribute.createString("name",
            "BizzSummit2022");
        
        AccountForm.OnLoad(context);
        Xrm.Navigation.openAlertDialog = jest.fn()
        nameFieldMock.fireOnChange();
        expect(Xrm.Navigation.openAlertDialog).toBeCalled();
    });
    
})