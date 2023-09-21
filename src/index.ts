
import { randomUUID } from 'node:crypto';
import { TopBraid, skos, skos_Concept, skos_ConceptScheme} from './lib/ontologie_archimate_ADS_generated_node';

  

 const main = async () => {
     console.log("starting main application");
     debugger
    TopBraid.init({
        serverURL: 'http://localhost:8083/tbl',
        dataGraphId: 'test',
        langs: ['nl'],
        readsDoNotDependOnWrites: false,
        streaming: false,
        requestConfig: { // Optional, here for basic authentication
            withCredentials: false,
            auth: {
                username: 'Administrator',
                password: ''
            }
        }
    });
    try {
        // skos.everyConceptScheme().forEach(scheme => {
        //         console.log("Found a cs: ", scheme.uri);
        // });
        const id = randomUUID();
        const uri = 'http://test.me/' + id;
        console.log ("Creating concept scheme: ", uri);
        let cs = skos.createConceptScheme ({
            uri: uri,
            rdfs_label: [
                "Test conceptscheme"
            ]
        });
     
    }
    catch (e) {
        console.log(`Had trouble creating conceptscheme`, e);
    }
    finally {
        console.log("Terminating session");
        TopBraid.terminate("ended test");
    }
 } 


 main();