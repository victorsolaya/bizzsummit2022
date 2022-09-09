export class AccountForm {
    static async OnLoad(context: Xrm.Events.EventContext): Promise<void> {
        const formContext: Xrm.FormContext = context.getFormContext();
        AccountForm.onChangeFunctionName(formContext);
    }

    static onChangeFunctionName(formContext: Xrm.FormContext) {
        formContext
        .getAttribute("name")
        .addOnChange(() => {
            const alertString: Xrm.Navigation.AlertStrings = { text: "Alerta", confirmButtonLabel: "Aceptar", title:"Titulito"};
            Xrm.Navigation.openAlertDialog(alertString)
        });
    }
}