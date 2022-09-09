# Unit Testing Jasvacript en D365

## Requisitos

1. Descargate NodeJS: https://nodejs.org/en/
1. Descargate VsCode: https://code.visualstudio.com/

## Inicio de proyecto

1. Vamos a la carpeta que queramos "cd C:/micarpetadeseada" 
1. "mkdir BizzSummit2022"
1. "cd BizzSummit2022"
1. "code ."

Abrimos el terminal

1. npm init
1. npm install typescript --save-dev
1. npx tsc -init

Dentro del tsconfig.json

```json
{
  "compilerOptions": {
    "module": "ES2015",
    "noImplicitAny": true,
    "removeComments": true,
    "preserveConstEnums": true,
    "outDir": "dist",
    "sourceMap": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.spec.ts", "dist"]
}
```

## Inicio del script

1. Vamos a instalar @types/xrm con nuestra linea de comandos. Esto lo hacemos para tener los tipos de typescript de Xrm para ayudarnos con nuestras lineas de código
```
npm install --save-dev @types/xrm
```
2. Si no tenemos una carpeta de src creamos una carpeta de src, con una carpeta llamada forumarios y un archivo .ts llamado AccountForm

```src/forms/accountform.ts```

3. Añadimos la siguiente clase .ts

```ts
export class AccountForm {
    static async OnLoad(context: Xrm.Events.EventContext): Promise<void> {
        context
        .getFormContext()
        .getAttribute("name")
        .addOnChange(() => {
            //Vamos a ver como funciona types/xrm con un Xrm.Navigation.alertDialog
        });
    }
}
```

## Webpack

Para poder realizar la transformacion de typescript a javascript legible por D365 vamos a usar webpack.
Webpack es una herramienta que toma el output the Typescript, lo parsea y lo junta en un solo archivo.

Vamos a realizar lo siguiente:

1. Instalar webpack

```npm install webpack webpack-cli webpack-merge ts-loader --save-dev```

El plugin ts-loader se encargará de compilar y así chequear todos los tipos.

2. Crear los archivos 

    1. webpack.common.js
    2. webpack.dev.js
    3. webpack.prod.js

### webpack.common.js

```js
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");

module.exports = {
  entry: {
    //Aqui cada uno de los archivos que tengamos
    accountform: "./src/forms/accountform.ts"
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: '[name].js',
    // Set this to your namespace e.g. cds.ClientHooks
    library: [ "bizzsummit"],
    libraryTarget: "var",
  },
};
```

### webpack.dev.js

```js
/* eslint-disable @typescript-eslint/no-var-requires */
const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
module.exports = merge(common, {
  mode: "development",
  devtool: "eval-source-map",
});
```

### webpack.prod.js

```js
/* eslint-disable @typescript-eslint/no-var-requires */
const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
module.exports = merge(common, {
  mode: "production",
    output: {
        filename: '[name].min.js'
    }
});
```

Dentro de package.json realizaremos los siguiente cambios en scripts:

```json
 "scripts": {
    "build": "webpack --config webpack.dev.js",
    "start": "webpack --config webpack.dev.js --watch",
    "prod": "webpack --config webpack.prod.js"
},
```

## Unit Testing

Ahora que ya tenemos todo configurado nos toca la parte de Unit Testing.
El unit testing lo realizaremos con Jest 

Para ello vamos a realizar los siguientes comandos:

1. ```npm install jest ts-jest xrm-mock @types/jest --save-dev```

Jest es una libreria para hacer run de tests
ts-jest nos permite usar jest con typescript
xrm-mock es una libreria para el formContext de las Model Driven Apps

2. Creamos jest.config.js
```js
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
};
```

3. Vamos a crear una carpeta llamada ```src/forms/__tests__```

```__tests__``` es una convencion de jest para buscar tests.

4. Creamos un archivo para nuestro test de account form
```src/forms/__tests__/unit.accountform.test.ts```

5. Copiamos el siguiente archivo .ts

```js

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
```

## Early bound

Vamos a sacar los early bound de nuestro entorno para ello hacemos 
```npx dataverse-auth myorg.crm.dynamics.com```

Una vez logueados (si no funciona haz npm i -D dataverse-auth) hay que instalar daverse-ify

```npm install dataverse-ify --save```

Y realizar un ```npx dataverse-gen init``` (Automaticamente te instalará dataverse-gen)

Se te creará un archivo llamado .dataverse-gen.json, ahi podremos poner las entidades que queramos.

Nosotros utilizaremos account y contact, te quedará algo asi

```js
{
  "entities": [
    "account", "contact"
  ],
  "actions": [],
  "functions": [],
  "output": {
    "outputRoot": "./src/dataverse-gen"
  }
}
```

Vamos a crear dentro de src una carpeta llamada ribbon, en la que vamos a añadir accountribbon.ts y una carpeta ```__tests__``` con ```integration.accountribbon.test.ts```

Dentro de accountribbon.ts vamos a poner:

```js
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
```

Esto lo que nos hace es simplemente llamar a un botton que nos va a crear un contacto con este account relacionado.

## Integration Testing

Ahora viene la parte en la que vamos a realizar una integracion contra nuestro propio Dataverse.

1. Dentro de webpack.common.js tendremos que tener nuestro nuevo entry

```js
...
    entry: {
        accountform: "./src/forms/accountform.ts",
        accountribbon: "./src/ribbon/accountiribbon.ts"
    },
...
```
2. Añadir un config.yaml para que funcione dataverse-ify

```yaml
nodewebapi:
  logging: verbose
  server:
    host: https://xxx.crm4.dynamics.com
    version: 9.1
```

3. Añadimos nuestro integration test

```js
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
```

## E2E Testing

Para usar el end to end testing la herramienta https://github.com/XRM-OSS/D365-UI-Test es muy intuitiva y facil de usar.
Tambien tiene una extension dentro de Chrome con la que se puede jugar y poder probar cosas.