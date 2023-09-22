/**
 * An RDF triple.
 * @typedef {Object} Triple
 * @property {NamedNode} subject - the subject node
 * @property {NamedNode} predicate - the predicate node (always a URI)
 * @property {GraphNode|boolean|number|string} object - the object node or JavaScript literal
 */

/**
 * The main entry point into the API (beside focusNode).
 */
const graph = {

	/**
	 * Adds a triple to the graph.
	 * @param {string|NamedNode} subject - the subject node of the triple to add (string values are interpreted as URIs)
	 * @param {string|NamedNode} predicate - the predicate node (string values are interpreted as URIs)
	 * @param {boolean|number|string|GraphNode} object - the object node of the triple to add
	 */
	add(subject, predicate, object) {
		__jenaData.add(subject, predicate, object);
	},

    /**
     * Adds an array of Triples (objects with subject, predicate and object fields) to the graph.
     * @param {Triple[]} triples - the Triple objects to add
     */
    addTriples(triples) {
        triples.forEach(triple => graph.add(triple.subject, triple.predicate, triple.object));
    },
	
	/**
	 * Creates a new blank node, with a yet unused ID, as a NamedNode.
	 * @returns {NamedNode}
	 */
	blankNode() {
		return new NamedNode(__jenaData.blankNode());
	},
	
    /**
     * For editable graphs, this returns a GraphChanges object that can be used to fetch details about which triples have
     * been added or removed by the current script, with the option to roll back those changes.
     * @returns {GraphChanges}
     */
    get changes() {
        return new GraphChanges();
    },
	
    /**
     * Performs a SPARQL CONSTRUCT query, resulting in an array of Triple objects.
     * @param {string} queryString - a SPARQL SELECT query
     * @param {?object} [bindings] - an optional object with name-value pairs to pre-bind for the query execution
     * @param {?boolean} [literalNodesOnly] - true to only return GraphNodes and neither boolean, number nor string
     * @returns {Triple[]} the resulting triples
     */
    construct(queryString, bindings, literalNodesOnly) {
		let raws = __jenaData.construct(queryString, bindings, literalNodesOnly);
        let results = [];
        for(let i = 0; i < raws.length; i++) {
            let raw = raws[i];
            results.push({
                subject: RDFNodeUtil.castValue(raw.subject),
                predicate: RDFNodeUtil.castValue(raw.predicate),
                object: RDFNodeUtil.castValue(raw.object),
            });
        }
        return results;
	},

	/**
	 * Checks if the graph contains any triple matching the provided subject, predicate, object combination,
	 * where each can be null to indicate a wildcard search.
	 * @param {?string|?Object} subject - the subject to match or null (string values are interpreted as URIs)
	 * @param {?string|?Object} predicate - the predicate to match or null (string values are interpreted as URIs)
	 * @param {?*} object - the object to match or null (JavaScript numbers that can be cast to integer will be matched to
     *        either xsd:integer or xsd:decimal).
	 */
	contains(subject, predicate, object) {
		return __jenaData.contains(subject, predicate, object);
	},

	/**
	 * Gets the URI of the currently active data graph.
	 * @returns {string}
	 */
	get dataGraphURI() {
		return __jenaData.getDataGraphURI();
	},
	
	set dataGraphURI(value) {
		throw 'The data graph URI cannot be changed by assignment - use withDataGraph instead.';
    },
	
    /**
     * Evaluates a SPARQL expression, as used in BIND or FILTER.
     * You can use EXISTS { ... } expressions similar to SPARQL ASK queries.
     * @param {string} sparql - a SPARQL expression
     * @param {Object} [bindings] - an optional object with name-value pairs to pre-bind for the query execution
     * @param {boolean} [literalNodesOnly] - true to only return GraphNodes and neither boolean, number nor string
     * @returns the result of the evaluation, either as a plain JavaScript value or a GraphNode (or null)
     */
	eval(sparql, bindings, literalNodesOnly) {
		return RDFNodeUtil.castValue(__jenaData.eval(sparql, bindings, literalNodesOnly));
	},

    /**
     * Returns an array of all instances of a given class (including instances of the subclasses).
     * @param {NamedNode} type - the class that the instances should be returned of 
     * @returns {NamedNode[]}
     */
    every(type) {
		return RDFNodeUtil.castValues(__jenaData.every(type.uri));
    },
	
	/**
	 * Returns a LiteralNode with datatype rdf:HTML with a given string as lexical form.
	 * @param {string} lex - the lexical form
	 * @returns {LiteralNode}
	 */
	html(lex) {
		return new LiteralNode({lex: lex, datatype: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#HTML'});
	},
	
	/**
	 * Returns a LiteralNode with datatype rdf:langString with a given string as lexical form and a given language tag.
	 * @param {string} lex - the string value
	 * @param {string} lang - the language code
	 * @returns {LiteralNode}
	 */
	langString(lex, lang) {
		return new LiteralNode({lex: lex, lang: lang});
	},
	
	/**
	 * Produces an instance of LiteralNode from a given input value.
	 * @param {boolean|number|string|Object} value - the input value
	 * @returns {LiteralNode} a LiteralNode or null if the value is null or undefined
	 */
	literal(value) {
		if(value == null || value == undefined) {
			return null;
		}
		else {
			return new LiteralNode(value);
		}		
	},
	
	/**
	 * Gets the local name part of a URI, e.g. the part after the last # or /.
	 * @param {string|Object} uri - the URI string or named node with a uri field
	 * @returns {string} the local name, possibly the empty string
	 */
	localName(uri) {
		return __jenaData.localName(typeof uri == 'string' ? uri : uri.uri);
	},
	
	/**
	 * Produces an instance of NamedNode from a given URI string or object.
	 * @param {string|object} value - the URI string or an object with uri or qname fields
	 * @returns {NamedNode} the NamedNode or null if value is null or undefined
	 */
	namedNode(value) {
		if(value == null || value == undefined) {
			return null;
		}
		else if(typeof value == 'string') {
			return new NamedNode({uri: value});
		}
		else if(typeof value == 'object' && (value.uri || value.qname)) {
			return new NamedNode(value);
		}
		else {
			throw "namedNode cannot handle: " + value;
		}
	},
	
	/**
	 * Gets the namespace part of a URI, e.g. the part until the last # or /.
	 * @param {string|Object} uri - the URI string or named node with a uri field
	 * @returns {string} the namespace
	 */
	nameSpace(uri) {
		return __jenaData.nameSpace(typeof uri == 'string' ? uri : uri.uri);
	},

    /**
     * Assuming the current graph uses a URI policy (e.g. UUIDs), this returns the next suitable URI
     * for a new instance of a given class.
     * @param {NamedNode} type - the primary rdf:type to create a new URI for
     * @returns {string} the new URI or the default namespace for the (default) label-based policy
     */
    newURI(type) {
        let r = this.eval('<http://topbraid.org/swa#newResourceForAssetCollection>($type)', {type: type});
        return r ? r.uri : null;
    },

	/**
	 * Converts a value into an instance of GraphNode.
	 * String are converted into LiteralNode with datatype xsd:string.
	 * Numbers are converted into either xsd:integer or xsd:decimal LiteralNodes.
	 * Booleans are converted into true or false LiteralNodes.
	 * If the input object already represents an instance of a subclass of GraphNode then that object will be morphed into an GraphNode.
	 * If the input object is an object with a field { uri: "..." } or { qname: "..." } then the result will be a URI node.
	 * If the input object is an object with a field { lex: "..." } then the result will be a literal. Use lang: "..." for
	 * rdf:langString literals and datatype: xsd.float for specific datatypes. xsd:string is the default datatype.
	 * An exception is raised if no suitable conversion is possible.
	 * Returns null if the input value is null or undefined.
	 * @param {?boolean|?number|?string|?Object} value - the input object or primitive value 
	 * @returns {GraphNode}
	 */
	node(value) {
		if(value == null || value == undefined) {
			return null;
		}
		if(value.uri || value.qname || (value.isLiteral && !value.isLiteral())) {
			return new NamedNode(value);
		}
		else {
			return new LiteralNode(value);
		}
	},

    /**
     * Performs a GraphQL query against the data graph and returns the response JSON.
     * This is only supported for queries (not mutations) and only if the current query graph is an asset collection
     * that is not an Ontology/shapes graph or File.
     * The response JSON will use the field "data" for the actual query results or "error".
     * @param {string} query - the query string
     * @param {?object} variables - an optional object with name-value pairs for the pre-defined variables
     * @returns {object} the GraphQL query response or null in case of low-level errors
     */
    ql(query, variables) {
        let graphId = dataset.masterGraphId(this.dataGraphURI);
        let workflowId = dataset.workflowId(this.dataGraphURI);
        if(workflowId != null) {
            graphId = graphId + '.' + workflowId;
        }
        let json = this.eval('<http://topbraid.org/teamwork#graphQLQuery>($graphId, $query, $variables)', {
            graphId: graphId,
            query: query,
            variables: variables ? JSON.stringify(variables) : null,
        })
        return json ? JSON.parse(json) : null;
    },
	
	/**
	 * Converts a URI into a qname, using the prefixes defined for the data graph.
	 * @param {string|Object} uri - the URI string or named node with a uri field
	 * @returns {string} the abbreviated name or null if no suitable prefix exists
	 */
	qname(uri) {
		return __jenaData.qname(typeof uri == 'string' ? uri : uri.uri);
	},

	/**
	 * Deletes a triple (or multiple triples) from the (base) graph.  If the triple is included from an imported sub-graph
	 * then it will remain in those.
	 * The function can take null as wildcards for any subject, predicate or object. In this case it will remove all
	 * matching triples.
	 * @param {?string|?Object} subject - the subject node of the triple to delete (string values are interpreted as URIs)
	 * @param {?string|?Object} predicate - the subject node (string values are interpreted as URIs)
	 * @param {?*} object - the object node of the triple to delete
	 */
	remove(subject, predicate, object) {
		__jenaData.remove(subject, predicate, object);
	},
	
    /**
     * Performs a SPARQL SELECT query.
     * @param {string} queryString - a SPARQL SELECT query
     * @param {?object} [bindings] - an optional object with name-value pairs to pre-bind for the query execution
     * @param {?boolean} [literalNodesOnly] - true to only return GraphNodes and neither boolean, number nor string
     * @returns {ResultSet} the result bindings
     */
	select(queryString, bindings, literalNodesOnly) {
		return RDFNodeUtil.castBindings(__jenaData.select(queryString, bindings, literalNodesOnly));
	},

    /**
     * Sets a namespace prefix for the query model, or removes a prefix declaration.
     * As this is a low-level operation affecting all users of this graph, this needs to be used with care.
     * @param {string} prefix - the prefix
     * @param {?string} [namespace] - the namespace or null to remove the prefix
     */
    setPrefix(prefix, namespace) {
        __jenaData.setPrefix(prefix, namespace);
    },

    /**
     * Runs an SWP element with a provided set of parameters.
     * This can not be used in read-only mode and should be used by experienced TopBraid users only.
     * 
     * NOTE: This function is likely going to be deleted in future versions.  Instead users are encouraged to explicitly
     * mark the SWP scripts that they want to call by making them instances of ui:Service and assigning a value for
     * dash:apiStatus (and possibly dash:canWrite) and then use the generated functions.
     * Meanwhile this function here is kept to simplify experiments.
     * 
     * @param {string} viewClass - the qname of the view class in the ui:graph, e.g. 'ex:MyElement'
     * @param {?object} [params] - name-value pairs for the arguments of the element, typically as GraphNodes
     * @returns {string} the SWP response as a string
     */
    swp(viewClass, params) {
    	return __jenaData.swp(viewClass, params);
    },

    /**
     * Performs a read/write transaction on either the current data graph (if first argument is null) or a selected graph.
     * If the first argument if provided, the function temporarily switches the active data graph to the given named graph and executes a function with that active graph.
     * The new graph will also become the default graph of SPARQL queries.
     * After the function has been executed, the previously active data graph will become active again.
     * The result of the transaction call is the result of its callback.
     * Assuming the script is not executed in read-only mode, the inner graph is writable.
     * The system will activate a "diff graph" that collects all changes, and features such as graph.changes can be used.
     * At the end of the transaction, the changes will be committed, unless no changes have been made.
     * Use graph.changes.rollBack() at the end of a transaction in case you want to make sure that no changes will be committed.
     * @param {?(string|NamedNode)} graphURI - the URI of the named graph that the transaction should be applied to or null for the current data graph
     * @param {?string} logMessage - a log message for the change history, or null for an automatically generated message
     * @param {function} callback - a function (that has no parameters) that will be called (immediately)
     * @returns {?*} the result of the callback
     */
    transaction(graphURI, logMessage, callback) {
        if(graphURI && typeof graphURI === 'object') {
            graphURI = graphURI.uri;
        }
        if(!graphURI) {
            graphURI = __jenaData.getDataGraphURI();
        }
        if(logMessage != null && logMessage != undefined && typeof logMessage != 'string') {
            throw 'Second argument of graph.transaction must be a log message string';
        }
        if(!(typeof callback === 'function')) {
            throw 'Third argument of graph.transaction must be a callback function';
        }
        let old = __jenaData.getDataGraphURI();
        __jenaData.enterDataGraphURI(graphURI, logMessage || 'Transaction from script');
        try {
            let result = callback();
            return result;
        }
        finally {
            __jenaData.exitDataGraphURI(old);
        }
    },

    /**
     * Queries the graph and produces an array of objects with the fields { subject, predicate, object }
     * for each triple that matches the given match subject, predicate and object (any of which may be null
     * to act as a wildcard).
     * Note that this may potentially return a very large number of matches, so needs to be handled with care.
     * Also note that this will only return the asserted triples in the graph.
     * @param {?NamedNode} [matchSubject] - the subject to match against or null for any
     * @param {?NamedNode} [matchPredicate] - the predicate to match against or null for any
     * @param {?NamedNode|?boolean|?number|?string} [matchObject] - the object to match against or null for any
     * @param {?boolean} [literalNodesOnly] - true to only return GraphNodes and neither boolean, number nor string for the object position
     * @returns {Triple[]} an array of objects with subject, predicate and object fields
     */
    triples(matchSubject, matchPredicate, matchObject, literalNodesOnly) {
        // For simplicity we now just use the SPARQL engine - could be optimized in the future if performance becomes an issue
        return this.select('SELECT * { ?subject ?predicate ?object }', {
            subject: matchSubject,
            predicate: matchPredicate,
            object: matchObject
        }, literalNodesOnly).bindings;
    },
    
    /**
     * Performs a SPARQL UPDATE. This only works if the graph is in read/write mode.
     * It can only modify the default query graph, i.e. don't use INSERT { GRAPH ... { } } or such.
     * @param {string} updateString - a SPARQL UPDATE request string
     * @param {?object} [bindings] - an optional object with name-value pairs to pre-bind for the update execution
     */
    update(updateString, bindings) {
    	__jenaData.update(updateString, bindings);
    },
    
    /**
     * Gets an uploaded file from a provided ID.
     * @param {string} fileId - the ID of the file, typically provided as parameter value from an Action
     * @returns {UploadedFile}
     * @deprecated Moved to IO.uploadedFile
     */
    uploadedFile(fileId) {
    	return new UploadedFile(fileId);
    },
	
	/**
	 * Converts a qname into a URI string.
	 * @param {string} qname - the qname
	 * @returns {string} the URI derived from the qname, or the original qname if no suitable prefix was found
	 */
	uri(qname) {
		return __jenaData.uri(qname);
	},

    /**
     * Performs constraint validation based on the SHACL shapes of the associated shapes graph (usually the shapes
     * defined and imported by the data graph).
     * Returns an array of validation result objects, which is empty if everything was OK.
     * @param {ValidationParameters} [params] - instructions on how to perform validation
     * @return {ValidationResult[]} the results or a boolean
     * @deprecated As of 7.2 please use tbs.validate()
     */
    validate(params) {
        let rs = __jenaData.validate(params);
        let results = [];
        for(let i = 0; i < rs.length; i++) {
            results.push(RDFNodeUtil.castObject(rs[i]));
        }
        return results;
    },
	
    /**
     * Temporarily switches the active data graph to a given named graph and executes a function with that active graph.
     * The new graph will also become the default graph of SPARQL queries.
     * After the function has been executed, the previously active data graph will become active again.
     * The result of the withDataGraph call is the result of its callback.
     * The graph becomes read-only inside of such blocks.
     * To perform changes to other graphs than the default graph, use graph.transaction().
     * @param {string|NamedNode} graphURI - the URI of the new named graph
     * @param {function} callback - a function (that has no parameters) that will be called (immediately)
     * @returns {?*} the result of the callback
     */
	withDataGraph(graphURI, callback) {
        if(typeof graphURI === 'object') {
            graphURI = graphURI.uri;
        }
        if(!graphURI) {
            throw 'Missing graphURI in graph.withDataGraph';
        }
		let old = __jenaData.getDataGraphURI();
		__jenaData.enterDataGraphURI(graphURI, null);
        try {
            let result = callback();
            return result;
        }
        finally {
            __jenaData.exitDataGraphURI(old);
        }
	},
	
	/**
	 * Returns a LiteralNode with datatype rdf:XMLLiteral with a given string as lexical form.
	 * @param {string} lex - the lexical form
	 * @returns {LiteralNode}
	 */
	xml(lex) {
		return new LiteralNode({lex: lex, datatype: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#XMLLiteral'});
	},
}

/**
 * Parameters for the graph.validate() function.
 * @typedef {Object} ValidationParameters
 * @property {NamedNode[]} [focusNodes] - an optional array of focus nodes to validate, ignoring any others
 */

/**
 * A SHACL validation result.
 * @typedef {Object} ValidationResult
 * @property {LiteralNode|NamedNode} focusNode - the focus node
 * @property {LiteralNode|NamedNode} [value] - the value node
 * @property {string} [path] - the path in SPARQL syntax, if applicable
 * @property {string} [message] - the message (in the most suitable language)
 * @property {string} constraintComponentURI - the URI of the constraint component that produced the result
 * @property {string} severity - 'Violation', 'Warning' or 'Info'
 */


/**
 * GraphNode is the base class of all graph node types.
 */
class GraphNode {

    constructor(obj) {
    	if(obj == null || obj == undefined) {
    		throw "Cannot create GraphNode without constructor parameter";
    	}
    	
    	if(typeof obj == 'object' && obj.getLiteralDatatypeURI) {
    		this.zzzJenaNode = obj;
    	}
    	else {
    		this.zzzJenaNode = __jenaData.asJenaNode(obj);
    		if(!this.zzzJenaNode) {
        		throw "Cannot create Jena Node from supplied constructor parameter " + obj;    			
    		}
    	}
    }
    
    /**
     * Compares this node with another node or value. For example, the other might be a string, and
     * equals would return true if this is a corresponding xsd:string literal.
     * @param {boolean|number|string|GraphNode} other - the value to compare this with
     * @returns {boolean} true if this is equal to the other value
     */
    equals(other) {
    	return __jenaData.equalNodes(this, other);
    }

    /**
     * Evaluates a SPARQL expression with $this bound to the current node.
     * @param {string} sparql - a SPARQL expression such as "EXISTS { $this a g:Country }" or "ex:function($this)"
     * @param {?Object} [bindings] - an optional object with name-value pairs to pre-bind for the query execution
     * @param {?boolean} [literalNodesOnly] - true to only return GraphNodes and neither boolean, number nor string for the object position
     * @returns the result of the evaluation
     */
    eval(sparql, bindings, literalNodesOnly) {
    	return __jenaData.evalThis(this.zzzJenaNode, sparql, bindings, literalNodesOnly);
    }

    /**
     * Checks if this has a given incoming/inverse value for a given property, or any inverse value for that property.
     * @param {NamedNode} predicate the property
     * @param {NamedNode} [subject] the expected value or null to check for any value
     * @returns {boolean}
     */
    hasSubject(predicate, subject) {
        return graph.contains(subject, predicate, this);
    }

    /**
     * Returns true if this node represents an RDF Blank Node.
     * @returns {boolean}  true if this is a blank node, false for literals and URIs
     */
    isBlankNode() {
   		return this.zzzJenaNode.isBlank();
    }
    
    /**
     * Returns true if this node represents an RDF literal.
     * @returns {boolean}  true if this is a Literal, false for blank nodes and URIs
     */
    isLiteral() {
   		return this.zzzJenaNode.isLiteral();
    }

    /**
     * Returns true if this node represents a URI.
     * @returns {boolean}  true if this is a URI, false for blank nodes and literals
     */
    isURI() {
   		return this.zzzJenaNode.isURI();
    }
    
    /**
     * Performs a SPARQL SELECT query with $this bound to the current node.
     * @param {string} sparql - a SPARQL SELECT query
     * @param {?object} [bindings] - an optional object with name-value pairs to pre-bind for the query execution
     * @param {?boolean} [literalNodesOnly] - true to only return GraphNodes and neither boolean, number nor string
     * @returns {ResultSet} the result bindings
     */
    select(sparql, bindings, literalNodesOnly) {
    	return RDFNodeUtil.castBindings(__jenaData.selectThis(this.zzzJenaNode, sparql, bindings, literalNodesOnly));
    }

    /**
     * Gets a GraphNodeArray representing all asserted incoming/inverse values of a given property (or property array) of this.
     * @param {NamedNode|NamedNode[]} property  the predicate or an array of them
     * @returns {GraphNodeArray}
     */
    subjects(property) {
        if(Array.isArray(property)) {
            let results = new GraphNodeArray();
            property.forEach(predicate => {
                graph.triples(null, predicate, this).forEach(triple => results.push(triple.subject));
            })
            return results;
        }
        else if(!(property instanceof NamedNode)) {
            throw 'argument of subjects function must be a NamedNode or an array of NamedNodes';
        }
        return GraphNodeArray.from(graph.triples(null, property, this).map(triple => triple.subject));
    }

    /**
     * Produces a string rendering of this node. For literals this is simply the lexical form.
     * For URIs and blank nodes, it will select a suitable label, typically derived from rdfs:label.
     * @returns {string}
     */
    toString() {
    	if(this.isLiteral()) {    		
    		return this.lex;
    	}
    	else {
    		return __jenaData.getDisplayLabel(this.zzzJenaNode)
    	}
    }
}


/**
 * The class of graph nodes that are representing RDF literals.
 */
class LiteralNode extends GraphNode {
    
    /**
     * The URI of the datatype, if this node represents a literal.
     * @readonly
     * @returns {string} the datatype URI
     */
    get datatype() {
    	if(this.isLiteral()) {
    		return this.zzzJenaNode.getLiteralDatatypeURI();
    	}
    }
    
    set datatype(value) {
    	throw "The datatype field of a literal is read-only. Create a new literal using graph.literal() etc.";
    }
    
    /**
     * The language code, if this node represents a literal. Returns undefined otherwise.
     * @readonly
     * @returns {string} the language code such as "en"
     */
    get lang() {
    	if(this.isLiteral()) {
    		return this.zzzJenaNode.getLiteralLanguage();
    	}
    }
    
    set lang(value) {
    	throw "The lang field of a literal is read-only. Create a new literal using graph.literal() etc.";
    }
    
    /**
     * The lexical (string) form, if this node represents a literal. Returns undefined otherwise.
     * @readonly
     * @returns {string} the literal, always as a string
     */    
    get lex() {
    	if(this.isLiteral()) {
    		return this.zzzJenaNode.getLiteralLexicalForm();
    	}
    }
    
    set lex(value) {
    	throw "The lex field of a literal is read-only. Create a new literal using graph.literal() etc.";
    }
	
	/**
	 * Converts this literal into a JavaScript boolean, based on the lexcial form
	 * ("true", "1", "false", "0" are permitted).
	 * Ideally, check datatype == xsd.boolean beforehand.
	 * An exception is thrown in all other cases.
	 * @returns {boolean}
	 */
	asBoolean() {
		let lex = this.lex;
		if(lex == 'true' || lex == '1') {
			return true;
		}
		else if(lex == 'false' || lex == '0') {
			return false;
		}
		throw 'asBoolean cannot cast: ' + lex;
	}
	
	/**
	 * Converts this literal into a JavaScript number.
	 * Will try to cast the lexical form using parseFloat.
	 * Typically used in conjunction with isNumeric().
	 * @returns {number}
	 */
	asNumber() {
		return parseFloat(this.lex);
	}
	
	/**
	 * Checks if this literal has a numeric datatype such as xsd:integer or xsd:decimal.
	 * @returns {boolean}
	 */
	isNumeric() {
		return __jenaData.isNumeric(this.datatype);
	}

    /**
     * Attempts to convert this into a primitive JavaScript literal of type boolean, string or number.
     * If that is not possible due to the datatype, this returns this unchanged.
     * @returns {boolean|number|string|LiteralNode}
     */
    simplify() {
        if(this.isNumeric()) {
            return this.asNumber();
        }
        else if(this.datatype == 'http://www.w3.org/2001/XMLSchema#boolean') {
            return this.asBoolean();
        }
        else if(this.datatype == 'http://www.w3.org/2001/XMLSchema#string') {
            return this.lex;
        }
        else {
            return this;
        }
    }

    toJSON() {
        let json = {
            lex: this.lex
        }
        if(this.lang) {
            json.lang = this.lang;
        }
        else if(this.datatype != 'http://www.w3.org/2001/XMLSchema#string') {
            json.datatype = this.datatype;
        }
        return json;
    }
}
Object.defineProperty(LiteralNode.prototype, 'datatype', {enumerable: true});
Object.defineProperty(LiteralNode.prototype, 'lang', {enumerable: true});
Object.defineProperty(LiteralNode.prototype, 'lex', {enumerable: true});


/**
 * The class of graph nodes that are representing URIs or blank nodes.
 */
class NamedNode extends GraphNode {

	constructor(obj) {
		super(typeof obj == 'string' ? { uri: obj } : obj);
	}
    
    /**
     * The URI string of nodes where isURI() returns true, and '_:' + blankNodeId for those where isBlankNode() returns true.
     * @readonly
     * @returns {string} the URI string
     */
    get uri() {
    	if(this.isURI()) {
    		return this.zzzJenaNode.getURI();
    	}
    	else if(this.isBlankNode()) {
    		return "_:" + this.zzzJenaNode.getBlankNodeLabel();
    	}
    }
    
    set uri(value) {
    	throw "The uri field of a named node is read-only. Create a new node using graph.namedNode() or the factory methods for each namespace prefix.";
    }


    /**
     * Adds a statement (this, predicate, object) to the graph.
	 * @param {string|Object} predicate - the predicate node (string values are interpreted as URIs)
	 * @param {*} object - the object node of the triple to add
     */
    add(predicate, object) {
        graph.add(this, predicate, object);
    }


    /**
     * Checks if this has a given value for a given property, or any value for that property.
     * @param {NamedNode} predicate the property
     * @param {boolean|number|string|object} [object] the expected value or null to check for any value
     * @returns {boolean}
     */
    hasObject(predicate, object) {
        return graph.contains(this, predicate, object);
    }

    
    /**
     * Checks whether this is an instance of a given (RDFS) class.
     * @param {string|NamedNode} type - either the NamedNode of a class or a string with the URI of the class
     * @returns {boolean} true if this has the type or a subclass thereof as its rdf:type, false otherwise
     */
    instanceOf(type) {
    	return __jenaData.instanceOf(this.zzzJenaNode, type);
    }

    
    /**
     * Gets the value of this node for a given path as a LiteralNode.
     * If multiple values exist then it will make a random choice.
     * @param {string|object} path  either in SPARQL 1.1 syntax or a named node with the URI of a property
     * @return {?LiteralNode} the path value as LiteralNode or null
     */
    literalValue(path) {
    	let simple = typeof path == 'object';
    	let jenaNode = __jenaData.valueNode(this.zzzJenaNode, simple ? path.uri : path, simple);
    	if(jenaNode != null && jenaNode.isLiteral()) {
            return new LiteralNode(jenaNode);
    	}
    	else {
    		return null;
    	}
    }

    
    /**
     * Gets the values of this node for a given path as a instances of LiteralNode.
     * @param {string|object} path  either in SPARQL 1.1 syntax or a named node with the URI of a property
     * @return {LiteralNode[]} the path values as LiteralNodes (dropping any non-literals)
     */
    literalValues(path) {
    	let simple = typeof path == 'object';
    	let jenaNodes = __jenaData.literalNodes(this.zzzJenaNode, simple ? path.uri : path, simple);
    	let results = new GraphNodeArray();
    	for(let i = 0; i < jenaNodes.length; i++) {
            results.push(new LiteralNode(jenaNodes[i]));
        }
        return results;
    }


    /**
     * Gets a GraphNodeArray representing all values of a given property or array of properties of this.
     * This function only returns the asserted values, while the values function would also return inferred values.
     * @param {NamedNode|NamedNode[]} property  the predicate or an array of them
     * @returns {GraphNodeArray}
     */
    objects(property, literalNodesOnly) {
        if(Array.isArray(property)) {
            let results = new GraphNodeArray();
            property.forEach(predicate => {
                graph.triples(this, predicate, null, literalNodesOnly).forEach(triple => results.push(triple.object));
            })
            return results;
        }
        else if(!(property instanceof NamedNode)) {
            throw 'first argument of objects function must be a NamedNode or an array of NamedNodes';
        }
        return GraphNodeArray.from(graph.triples(this, property, null, literalNodesOnly).map(triple => triple.object));
    }


    /**
     * Gets the value of this node for a given path as a NamedNode.
     * If multiple values exist then it will make a random choice.
     * @param {string|object} path  either in SPARQL 1.1 syntax or a named node with the URI of a property
     * @param {?object} [asClass]  an optional subclass of NamedNode to convert the result into 
     * @return {?NamedNode} the path value as NamedNode or null if no value exists or it's a literal
     */
    namedValue(path, asClass) {
    	let simple = typeof path == 'object';
    	let value = __jenaData.value(this.zzzJenaNode, simple ? path.uri : path, simple);
    	if(value != null && typeof value == 'object' && !value.isLiteral()) {
            return RDFNodeUtil.castValue(value, asClass);
    	}
    	else {
    		return null;
    	}
    }


    /**
     * Gets the values of this node for a given path as instances of NamedNode.
     * @param {string|object} path  either in SPARQL 1.1 syntax or a named node with the URI of a property
     * @param {?object} [asClass]  an optional subclass of NamedNode to convert the result into 
     * @return {NamedNode[]} the path values as NamedNodes (dropping any literals)
     */
    namedValues(path, asClass) {
        return this.values(path, asClass).filter(value => value instanceof NamedNode);
    }


    /**
     * Removes the statement (this, predicate, object) from the graph.
	 * @param {string|NamedNode} predicate - the predicate node (string values are interpreted as URIs)
	 * @param {*} object - the object node of the triple to remove
     */
    remove(predicate, object) {
        graph.remove(this, predicate, object);
    }


    /**
     * Gets an array of shapes that apply to this node, based on sh:targetClass, dash:applicableToClass, and rdf:type.
     * This only returns the directly applicable shapes but not their superclasses.
     * Deactivated shapes are skipped.
     * @returns {sh_Shape[]} an array of shape objects
     */
    shapes() {
        let array = [];
    	let seenURIs = new Set();
    	this.values(rdf.type).forEach(type => {
    	    if(type instanceof NamedNode) {
    	        if(type.instanceOf(sh.Shape) && !seenURIs.has(type.uri)) {
    	            array.push(sh.asShape(type));
                    seenURIs.add(type.uri);
    	        }
    	    }
    	    rdfs.asClass(type).walkSuperclasses((cls) => {
    	        graph.triples(null, dash.applicableToClass, cls).forEach(triple => {
                    if(!seenURIs.has(triple.subject.uri)) {
                        array.push(sh.asShape(triple.subject));
                        seenURIs.add(triple.subject.uri);
                    }
    	        })
    	        graph.triples(null, sh.targetClass, cls).forEach(triple => {
                    if(!seenURIs.has(triple.subject.uri)) {
                        array.push(sh.asShape(triple.subject));
                        seenURIs.add(triple.subject.uri);
                    }
    	        })
    	    })
    	})
        return array.filter(shape => !shape.hasObject(sh.deactivated, true));
    }	

    
    /**
     * Gets the value of this node for a given path as a string.
     * If multiple values exist then it will make a random choice.
     * @param {string|object} path  either in SPARQL 1.1 syntax or a named node with the URI of a property
     * @return {?string} the path value as string or null if no value exists or is not a literal
     */
    stringValue(path) {
    	let simple = typeof path == 'object';
    	let value = __jenaData.value(this.zzzJenaNode, simple ? path.uri : path, simple);
        if(typeof value == 'string') {
            return value;
        }
    	else if(typeof value == 'boolean' || typeof value == 'number') {
            return value.toString();
        }
        else if(value != null && typeof value == 'object' && value.isLiteral()) {
            return value.getLiteralLexicalForm();
    	}
    	else {
    		return null;
    	}
    }


    /**
     * Gets the values of this node for a given path as plain strings.
     * @param {string|object} path  either in SPARQL 1.1 syntax or a named node with the URI of a property
     * @return {string[]} the path values as strings (non-literals will be dropped)
     */
    stringValues(path) {
        return this.values(path).filter(value => !(value instanceof NamedNode)).map(value => value instanceof LiteralNode ? value.lex : value.toString())
    }


    toJSON() {
        return {
            uri: this.uri
        }
    }

    
    /**
     * Gets the value of this node for a given path.  If multiple values exist then it will make a random choice.
     * @param {string|object} path  either in SPARQL 1.1 syntax or a named node with the URI of a property
     * @param {?object} [asClass]  an optional subclass of NamedNode to convert the result into 
     * @return {?GraphNode|?boolean|?number|?string} the path value as GraphNode or primitive JavaScript value, or null
     */
    value(path, asClass) {
    	let simple = typeof path == 'object';
    	let value = __jenaData.value(this.zzzJenaNode, simple ? path.uri : path, simple);
    	if(value != null) {
            return RDFNodeUtil.castValue(value, asClass);
    	}
    	else {
    		return null;
    	}
    }

    
    /**
     * Gets all values of this node for a given path as an array.
     * @param {string|object} path  either in SPARQL 1.1 syntax or a named node with the URI of a property
     * @param {?object} [asClass]  an optional subclass of NamedNode to convert the results into
     * @param {?boolean} [indexed]  true to return the values by their dash:index (if exists) 
     * @return {GraphNodeArray}  an array of path values as GraphNodes or primitive JavaScript values
     */
    values(path, asClass, indexed) {
    	let simple = typeof path == 'object';
    	let jenaValues = indexed ? 
    			__jenaData.valuesIndexed(this.zzzJenaNode, simple ? path.uri : path, simple) : 
    			__jenaData.values(this.zzzJenaNode, simple ? path.uri : path, simple);
    	let results = new GraphNodeArray();
    	for(let i = 0; i < jenaValues.length; i++) {
    		results.push(RDFNodeUtil.castValue(jenaValues[i], asClass));
    	}
   		return results;
    }
}
Object.defineProperty(NamedNode.prototype, 'uri', {enumerable: true});


/**
 * Instances of this class are fetched through graph.changes and can be used to learn about
 * the (uncommitted) changes to the graph in this session, and possibly to revert them.
 */
class GraphChanges {

    /**
     * Gets the number of added triples.
     * @return {number}
     */
    getAddedTripleCount() {
        return __jenaData.getAddedTripleCount();
    }

    /**
     * Gets the triples that have been added, for example through graph.add()
     * @returns {Triple[]}
     */
    getAddedTriples() {
        let results = [];
        let triples = __jenaData.getAddedTriples();
        for(let i = 0; i < triples.length; i++) {
            results.push(RDFNodeUtil.castObject(triples[i]))
        }
        return results;
    }

    /**
     * Gets an array of NamedNode instances for all nodes that appear in the subject position of an
     * added or removed triple.
     * This can be used as a heuristic to determine which focus nodes need to be checked/validated
     * before changes get committed.
     * @returns {NamedNode[]}
     */
    getEditedNodes() {
        let set = new Set();
        let results = [];
        this.getAddedTriples().forEach(triple => {
            if(!set.has(triple.subject.uri)) {
                results.push(triple.subject);
                set.add(triple.subject.uri);
            }
        })
        this.getRemovedTriples().forEach(triple => {
            if(!set.has(triple.subject.uri)) {
                results.push(triple.subject);
                set.add(triple.subject.uri);
            }
        })
        return results;
    }

    /**
     * Gets the number of removed triples.
     * @return {number}
     */
    getRemovedTripleCount() {
        return __jenaData.getRemovedTripleCount();
    }

    /**
     * Gets the triples that have been removed, for example through graph.remove()
     * @returns {Triple[]}
     */
    getRemovedTriples() {
        let results = [];
        let triples = __jenaData.getRemovedTriples();
        for(let i = 0; i < triples.length; i++) {
            results.push(RDFNodeUtil.castObject(triples[i]))
        }
        return results;
    }

    /**
     * Reverts all changes without committing them.
     * After this operation, the added and removed triples will be empty.
     */
    rollBack() {
        __jenaData.rollBack();
    }
}


/**
 * The class of SPARQL result sets, typically produced by a SELECT query.
 */
class ResultSet {

	constructor(object) {
		/**
		 * The array of variable names.
		 * @type {string[]}
		 */
		this.vars = object.vars;
		if(!this.vars || !Array.isArray(this.vars)) {
			throw 'Missing or invalid vars';
		}
		
		/**
		 * The array of bindings, which are objects with the variable names as keys.
		 * @type {Object[]}
		 */
		this.bindings = object.bindings;
		if(!this.bindings || !Array.isArray(this.bindings)) {
			throw 'Missing or invalid bindings';
		}
	}
}


/**
 * A tag string function that inserts JavaScript expressions as well-formed SPARQL expressions.
 * For example, use sparql`ASK { ${subject} rdfs:label ?label }` where subject is a GraphNode.
 * This is an alternative to using pre-bound variables (e.g. the bindings argument of graph.select).
 * Note that producing distinct strings carries a bit of performance overhead (for parsing)
 * while pre-bound variables can reuse an already parsed query object, at least within the same request.
 * However, string substitution can be a more compact, more natural and more flexible solution.
 * @param strings  the string segments
 * @param ...values  the values to insert
 * @returns {string} a string using SPARQL syntax substitution
 */
function sparql(strings, ...values) {
    let str = '';
    for(let i = 0; i < strings.length; i++) {
        str += strings[i];
        if(i < values.length) {
            let value = values[i];
            let vs = __jenaData.sparqlExpressionString(value);
            str += vs;
        }
    }
    return str;
}


// Utility functions, likely to become private API
const RDFNodeUtil = {
		
	castBindings: (object) => {
		let bindings = [];
		let list = object.bindings;
		for(let i = 0; i < list.length; i++) {
			let binding = list[i];
			let b = {};
			for(let varName in binding) {
				let value = binding[varName];
				b[varName] = RDFNodeUtil.castValue(value);
			}
			bindings.push(b);
		}
		return {
			bindings: bindings,
			vars: object.vars,
		}
	},
	
	castObject: (object) => {
		for(let key in object) {
			object[key] = RDFNodeUtil.castValue(object[key]);
		}
		return object;
	},
	
	castValue: (value, asClass) => {
		if(value == null || value == undefined) {
			return null;
		}
		else if(typeof value == 'string' || typeof value == 'number' || typeof value == 'boolean') {
            return value;
        }
        else if(asClass) {
            return new asClass(value);
        }
        else {
            return graph.node(value);
        }
    },
	
	castValues: (list, asClass) => {
		let results = [];
		for(let i = 0; i < list.length; i++) {
			results.push(RDFNodeUtil.castValue(list[i], asClass));
		}
		return results;
	},
	
	createInstance: (cls, typeURI, props) => {
		let instance;
		if(props) {
			instance = props.uri || props.qname ? new cls(props) : new cls(graph.blankNode());
			let copy = {};
			Object.assign(copy, props);
			delete copy.uri;
			delete copy.qname;
			Object.assign(instance, copy);
		}
		else {
			instance = new cls(graph.blankNode());
		}
		graph.add(instance, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', { uri: typeURI });
		return instance;
	},

    createList: (nodes) => {
        let nil = graph.namedNode(rdf.NS + 'nil');
        if(nodes.length == 0) {
            return nil;
        }
        let root = graph.blankNode();
        let current = root;
        nodes.forEach((node, index) => {
            current.add(rdf.first, node);
            let rest = index < nodes.length - 1 ? graph.blankNode() : nil;
            current.add(rdf.rest, rest);
            current = rest;
        })
        return root;
    },
	
	// Provides access to the graph variable in case it's overloaded in the scope
	getGraph: () => {
		return graph;
	}
}

const TestUtil = {

    assert: (condition, message) => {
        if(!condition) {
            throw message || 'Test assertion failed';
        }
    }
}


/**
 * The base type for the properties of all NamedNodes, declaring the uri property.
 * @typedef NamedNode_Props
 * @property {!string} uri - the URI serving as unique identifier of the resource in the graph
 */

/**
 * A collection of functions to operate on the named graphs in TopBraid.
 */
const dataset = {

    /**
     * The URI of the graph that may be used to query the added triples from a dash:ChangeScript or dash:CommitScript.
     */
    addedGraphURI: 'http://datashapes.org/dash#addedGraph',

    /**
     * The URI of the graph that may be used to query the deleted triples from a dash:ChangeScript or dash:CommitScript.
     */
    deletedGraphURI: 'http://datashapes.org/dash#deletedGraph',

    /**
     * Returns true if the current user has (at least) read access to a given graph.
     * @param {string} graphURI - the URI of the graph to check
     * @returns {boolean}
     */
    canRead(graphURI) {
        return this.contains(graphURI) && graph.eval('<http://topbraid.org/sparqlmotionfunctions#canRead>($graphURI)', { graphURI: { uri: graphURI }});
    },

    /**
     * Returns true if the current user has write access to a given graph.
     * @param {string} graphURI - the URI of the graph to check
     * @returns {boolean}
     */
    canWrite(graphURI) {
        return this.contains(graphURI) && graph.eval('<http://topbraid.org/sparqlmotionfunctions#canWrite>($graphURI)', { graphURI: { uri: graphURI }});
    },

    /**
     * Checks if a given named graph is known to this dataset and backed by a file (including connector files to databases).
     * @param {string} graphURI - the URI of the graph to look for
     * @returns {boolean} true if there is a graph with that URI
     */
    contains(graphURI) {
        return !!graphURI && !!graph.eval('<http://topbraid.org/sparqlmotionfunctions#file>($graphURI)', { graphURI: graphURI});
    },

    /**
     * Creates an in-memory graph with a fresh URI that can be used for the duration of the surrounding script.
     * Such temp graphs may be used to collect triples, for example via graph.transaction.
     * @returns {string} the URI of the new graph
     */
    createTempGraph() {
        return __jenaData.createTempGraph();
    },

    /**
     * Gets an array of the URIs of all known graphs in the dataset.
     * Note that the current user may not have read access to all of them.
     * @returns {string[]}
     */
    graphs() {
        return graph.select(`
            SELECT DISTINCT ?graph {
                ?path <http://www.topbraid.org/tops#files> ( "/" true )
                BIND (<http://topbraid.org/sparqlmotionfunctions#baseURI>(?path) AS ?graph) .
                FILTER bound(?graph)
            }`).bindings.map(binding => binding.graph.uri);
    },

    /**
     * For a given (master) graph, this returns the graph type, aka asset collection type.
     * If the graph is not a master graph, this returns null.
     * @param {string} graphURI - the URI of the master graph to query
     * @returns {GraphType} the GraphType or null
     */
    graphType(graphURI) {
        let t = graph.eval('<http://topbraid.org/teamwork#getProjectType>($graph)', { graph: { uri: graphURI }})
        return t ? new GraphType(t.uri) : null;
    },

    /**
     * Gets an array of all registered GraphTypes in the system.
     * All installations include the Ontology GraphType, others depend on the licensed package.
     * @returns {GraphType[]}
     */
    graphTypes() {
        return graph.select(`
            SELECT ?projectType
            WHERE {
                GRAPH <http://uispin.org/ui#graph> {
                    BIND (<http://topbraid.org/teamwork#product>() AS ?product) .
                    ?product <http://topbraid.org/teamwork#defaultProjectType> ?projectType .
                    FILTER (<http://topbraid.org/teamwork#hasProjectTypeLicense>(?projectType))
                }
            }`).bindings.map(binding => new GraphType(binding.projectType.uri))
    },

    /**
     * Attempts to find the master graph URI for a given graph URI.
     * The graph URI must either be of the form "urn:x-evn-master:XY" or "urn:x-evn-master:XY:UserName"
     * or a workflow graph "urn:x-evn-tag:XY:UserName".
     * It also handles cases where the graph is with imports.
     * @param {string} graphURI - the graph URI
     * @returns {string} the master graph URI or null if the input URI does not match any of the expected patterns.
     */
    masterGraph(graphURI) {
        let r = graph.select(`
            SELECT ?masterGraph {
                BIND (<http://topbraid.org/teamwork#graphIdFromGraph>(<http://uispin.org/ui#graphWithoutImports>($graph)) AS ?id)
                BIND (<http://topbraid.org/teamwork#masterGraph>(?id) AS ?masterGraph) .
                FILTER bound(?masterGraph)
            }`, {
                graph: { uri: graphURI }
            });
        if(r.bindings.length > 0) {
            return r.bindings[0].masterGraph.uri;
        }
        else {
            return null;
        }
    },

    /**
     * Extracts the graphId part of a given graph URI.
     * See dataset.masterGraph() for the supported URI kinds.
     * @param {string} graphURI - the graph URI
     * @returns {string} the ID part, e.g. "XY" for "urn:x-evn-master:XY"
     */
    masterGraphId(graphURI) {
        let r = graph.select(`
            SELECT ?graphId {
                BIND (<http://topbraid.org/teamwork#graphIdFromGraph>(<http://uispin.org/ui#graphWithoutImports>($graph)) AS ?graphId)
            }`, {
                graph: { uri: graphURI }
            });
        if(r.bindings.length > 0) {
            return r.bindings[0].graphId;
        }
        else {
            return null;
        }
    },

    /**
     * Gets an array of the URIs of all master graphs in the dataset that the current user can read.
     * The strings will be of the form "urn:x-evn-master:XY" where XY is the graphId.
     * @returns {string[]}
     */
    masterGraphs() {
        return graph.select(`
            SELECT ?masterGraph {
                ()	<http://topbraid.org/teamwork#readableGraphsUnderTeamControl> (?masterGraph) 
            }`).bindings.map(binding => binding.masterGraph.uri);
    },

    /**
     * Performs a SPARQL SELECT query against a SPARQL endpoint that is linked to a remote asset collection
     * (using tosh:remoteEndpoint etc).
     * @param {string} graphURI - the URI of the asset collection, e.g. 'urn:x-evn-master:remotegeo'
     * @param {string} query - the SELECT query string including prefixes where needed
     * @param {?boolean} [literalNodesOnly] - true to only return GraphNodes and neither boolean, number nor string
     * @returns {ResultSet} the result bindings, same as graph.select
     */
    remoteSelect(graphURI, query, literalNodesOnly) {
        return RDFNodeUtil.castBindings(__jenaData.remoteSelect(graphURI, query, literalNodesOnly));
    },
    
    /**
     * Performs a SPARQL UPDATE against a SPARQL endpoint that is linked to a remote asset collection.
     * Note that this is not going to update the local TopBraid copy of that graph.
     * @param {string} graphURI - the URI of the asset collection, e.g. 'urn:x-evn-master:remotegeo'
     * @param {string} updateString - a SPARQL UPDATE request string
     */
    remoteUpdate(graphURI, updateString) {
    	__jenaData.remoteUpdate(graphURI, updateString);
    },

    /**
     * Gets the URI of a teamwork graph (.tch) for a given master graph.
     * @param {string} masterGraphURI - the URI of a master graph, e.g. "urn:x-evn-master:geo"
     * @returns {string} the associated TCH graph
     */
    teamGraph(masterGraphURI) {
        return masterGraphURI + '.tch';
    },

    /**
     * Gets a variant of an input graph URI that also includes the owl:imports.
     * This uses a platform-specific URI naming convention that will be understood by most dataset operations.
     * This is equivalent to the SPARQL function ui:graphWithImports(?graphURI).
     * @param {string|object} graphURI - the URI to convert into the with-imports variation
     * @returns {string} the graph URI with imports
     */
    withImports(graphURI) {
        let uri = typeof graphURI == 'object' ? graphURI.uri : graphURI;
        let result = graph.eval('<http://uispin.org/ui#graphWithImports>($graph)', { graph: { uri: uri }});
        return result ? result.uri : null;
    },

    /**
     * Gets a variant of an input graph URI that excludes the owl:imports.
     * This is the inverse operation of dataset.withImports(graphURI).
     * @param {string|object} graphURI - the URI to convert into the without-imports variation
     * @returns {string} the input graph URI without imports
     */
    withoutImports(graphURI) {
        let uri = typeof graphURI == 'object' ? graphURI.uri : graphURI;
        let result = graph.eval('<http://uispin.org/ui#graphWithoutImports>($graph)', { graph: { uri: uri }});
        return result ? result.uri : null;
    },

    /**
     * Attempts to extract a workflow ID from a given query graph.
     * Returns null if the graph is not a workflow.
     * @param {string} graphURI - the graph URI
     * @returns {?string} the workflow ID or null
     */
    workflowId(graphURI) {
        let result = graph.eval('<http://topbraid.org/teamwork#tagIdFromTagGraph>(<http://uispin.org/ui#graphWithoutImports>($graph))', 
            { graph: { uri: graphURI }});
        return result;
    }
}

/**
 * Utility functions to produce values for certain dash:Viewers.
 */
const DataViewers = {

    /**
     * Takes a result set object as input and produces an rdf:JSON literal that can be handled by
     * the dash:JSONTableViewer.
     * The result set must be an object with a string array 'vars' and an array 'bindings' with
     * name-value pairs for each var. This is the same format as produced by graph.select().
     * This function can be used in conjunction with sh:values rules that dynamically compute property
     * values for rendering purposes on the client.
     * @param {ResultSet} resultSet - the result set object with the 'raw' bindings
     * @param {JSONTableViewerProps} [props] - optional properties for the table viewer
     * @returns {LiteralNode} an rdf:JSON literal wrapping the resultSet
     */
    createTableViewerJSON(resultSet, props) {
        let rs = {}
        Object.assign(rs, resultSet);
        if(props) {
            Object.assign(rs, props);
        }
        rs.bindings.forEach(binding => {
            for(let key in binding) {
                let value = binding[key];
                let node = graph.node(value);
                if(node instanceof LiteralNode) {
                    binding[key] = {
                        lex: node.lex,
                        lang: node.lang,
                        datatype: node.datatype,
                    }
                }
                else if(node instanceof NamedNode) {
                    binding[key] = {
                        uri: node.uri,
                        label: node.toString(),
                    }
                }
            }
        })
        return graph.literal({
            lex: JSON.stringify(rs),
            datatype: rdf.JSON.uri,
        });
    }
}

/**
 * The optional parameters for a JSONTableViewer.
 * @typedef {Object} JSONTableViewerProps
 * @param {string[]} [headerLabels] an optional array of header labels to use instead of the vars
 */

/**
 * A subclass of Array for booleans, numbers, strings, LiteralNodes or NamedNodes,
 * with dedicated helper functions for typical graph-based operations.
 */
 class GraphNodeArray extends Array {

    // Note that methods such 

    /**
     * Produces a GraphNodeArray by changing the type of an existing JavaScript array.
     * @param {*[]} a  the input array
     * @returns {GraphNodeArray} the input array but with a different type
     */
    static from(a) {
        return Object.setPrototypeOf(a, GraphNodeArray.prototype);
    }

    /**
     * Checks if this array contains a given value, using equality comparison, not just identity.
     * @param {*} value  the value to look for
     * @returns {boolean} true if there is an equal node in this array
     */
    contains(value) {
        let match = graph.node(value);
        return this.some(node => match.equals(node));
    }

    /**
     * Returns a new GraphNodeArray that has any duplicate nodes eliminated, using equals semantics.
     * This may be useful after concatenating two or more GraphNodeArrays.
     * @returns {GraphNodeArray}
     */
    distinct() {
        let results = new GraphNodeArray();
        let seen = new Set();
        this.forEach(item => {
            // Use either the URI or the canonical JSON string of literal as unique key
            let str = item instanceof NamedNode ? item.uri : JSON.stringify(graph.node(item).toJSON());
            if(!seen.has(str)) {
                seen.add(str);
                results.push(item);
            }
        })
        return results;
    }

    /**
     * Assuming the first array item represents a literal, this will return it as a LiteralNode, otherwise undefined.
     * @returns {LiteralNode?}
     */
    literalNode() {
        if(this[0] instanceof LiteralNode) {
            return this[0]
        }
        else if(typeof this[0] == 'boolean' || typeof this[0] == 'number' || typeof this[0] == 'string') {
            return graph.literal(this[0]);
        }
        else {
            return undefined;
        }
    }

    /**
     * Returns the first item in the array if it's a NamedNode, otherwise undefined.
     * @returns {NamedNode?}
     */
    namedNode() {
        return this[0] instanceof NamedNode ? this[0] : undefined;
    }

    /**
     * Returns the first item in the array as a LiteralNode or a NamedNode or undefined if it's empty array.
     * @returns {GraphNode}
     */
    node() {
        if(this.length > 0) {
            return graph.node(this[0]);
        }
        else {
            return undefined;
        }
    }

    /**
     * Gets a new GraphNodeArray consisting of all objects of triples where the members of this are the subjects
     * and one or more given properties are the predicates.
     * @param {NamedNode|NamedNode[]} property  the predicate or an array of them
     * @param {boolean} [literalNodesOnly]  true to only return NamedNodes or LiteralNodes
     * @returns {GraphNodeArray}
     */
    objects(property, literalNodesOnly) {
        let results = new GraphNodeArray();
        if(Array.isArray(property)) {
            property.forEach(predicate => {
                this.forEach(item => {
                    graph.triples(item, predicate, null, literalNodesOnly).forEach(triple => results.push(triple.object));
                })
            })
        }
        else {
            this.forEach(item => {
                graph.triples(item, property, null, literalNodesOnly).forEach(triple => results.push(triple.object));
            })
        }
        return results;
    }

    /**
     * Gets a new GraphNodeArray consisting of all subjects of triples where the members of this are the objects
     * and one or more given properties are the predicates.
     * @param {NamedNode|NamedNode[]} property  the predicate or an array of them
     * @returns {GraphNodeArray}
     */
    subjects(property) {
        let results = new GraphNodeArray();
        if(Array.isArray(property)) {
            property.forEach(predicate => {
                this.forEach(item => {
                    graph.triples(null, predicate, item).forEach(triple => results.push(triple.subject));
                })
            })
        }
        else {
            this.forEach(item => {
                graph.triples(null, property, item).forEach(triple => results.push(triple.subject));
            })
        }
        return results;
    }

    toString() {
        return `${JSON.stringify(this.toJSON())}`;
    }

    /**
     * Returns a new GraphNodeArray consisting of only those items in the current array that are
     * subject in triples with a given property and a given object, or any object.
     * @param {NamedNode} property  the match predicate
     * @param {boolean|number|string|GraphNode} [value]  the match object or nothing for any match
     * @returns {GraphNodeArray}
     */
    withObject(property, value) {
        return this.filter(item => graph.contains(item, property, value));
    }

    /**
     * Returns a new GraphNodeArray consisting of only those items in the current array that are
     * object in triples with a given property and a given subject, or any subject.
     * @param {NamedNode} property  the match predicate
     * @param {NamedNode} [value]  the match subject or nothing for any match
     * @returns {GraphNodeArray}
     */
    withSubject(property, value) {
        return this.filter(item => graph.contains(value, property, item));
    }


    // Standard methods from Array are overloaded here to declare the JSDoc for better auto-complete support

    /**
     * Returns a new GraphNodeArray consisting of the items in this and a given other array.
     * @param {GraphNodeArray} other 
     * @returns {GraphNodeArray}
     */
    concat(other) {
        return super.concat(other);
    }

    /**
     * @returns {GraphNodeArray}
     */
    filter(filterfn) {
        return super.filter(filterfn);
    }

    forEach(callbackfn) {
        super.forEach(callbackfn);
    }

    /**
     * @returns {GraphNodeArray}
     */
    map(callbackfn) {
        return super.map(callbackfn);
    }
}

/**
 * Utility functions operating on GraphNodes.
 */
const GraphNodeUtil = {

    classes: {
        'LiteralNode': LiteralNode,
        'NamedNode': NamedNode,
    },
		
	/**
	 * Produces a JSON object by recursively walking a blank nodes (subject) and its (object) values.
	 * Each NamedNode is represented by a JSON object that has the property values as fields, so that the value key
	 * is the URI of each predicate, and the values are arrays of nested objects or primitive values.
     * The algorithm will terminate recursion at URI nodes, for which it only produces label and uri.
	 * @param {NamedNode} node - the current named node
	 * @returns {Object}
	 */
	jsonValuesTree: (node) => {
	    if(node.isBlankNode()) {
	        let obj = {};
	        graph.triples(node).forEach(t => {
	            let values = obj[t.predicate.uri];
	            if(!values) {
	                values = [];
	                obj[t.predicate.uri] = values;
	            }
	            if(t.object instanceof NamedNode) {
	                values.push(GraphNodeUtil.jsonValuesTree(t.object));
	            }
	            else if(t.object instanceof LiteralNode) {
	                values.push({
	                    lex: t.object.lex,
	                    datatype: t.object.datatype
	                })
	            }
	            else {
	                values.push(t.object);
	            }
	        })
	        return obj;
	    }
	    else {
	        return {
	            label: node.toString(),
	            uri: node.uri,
	        }
	    }
	},

    /**
     * A helper function to enable TopBraid.installFunction(). It is used to prepare an object tree so that it can be serialized as JSON
     * without containing all the property values of GraphNodes.  If the input object is a GraphNode it will produce a simplified
     * object with only the core fields such as uri and lex, plus a __type field with the name of the original class.
     * @param {?*} obj - the object to flatten the graph nodes of
     */
    flattenGraphNodes: (obj) => {
        if(obj instanceof GraphNode) {
            let flat = {
                __type: obj.constructor.name
            }
            if('uri' in obj) {
                flat.uri = obj.uri;
            }
            else {
                flat.lex = obj.lex;
                if('datatype' in obj) {
                    flat.datatype = obj.datatype;
                }
                if('lang' in obj) {
                    flat.lang = obj.lang;
                }
            }
            return flat;
        }
        else if(obj != null && Array.isArray(obj)) {
            return obj.map(GraphNodeUtil.flattenGraphNodes);
        }
        else if(obj != null && typeof obj == 'object') {
            let clone = {};
            for(let key in obj) {
                let old = obj[key];
                clone[key] = GraphNodeUtil.flattenGraphNodes(old);
            }
            return clone;
        }
        else {
            return obj;
        }
    },

    /**
     * The opposite of flattenGraphNodes. Attention: this may modify the input objects, replacing any object with a __type
     * field to become GraphNode instances.
     * @param {?*} obj - the value to unflatten
     * @returns {*} either the original obj or a new one
     */
    unflattenGraphNodes: (obj) => {
        if(obj != null && typeof obj == 'object') {
            let type = obj.__type;
            if(type) {
                let cls = GraphNodeUtil.classes[type];
                if(!cls) {
                    throw 'Unexpected __type: ' + type;
                }
                let neo = new cls(obj);
                return neo;
            }
            else {
                for(let key in obj) {
                    let value = obj[key];
                    let newValue = GraphNodeUtil.unflattenGraphNodes(value);
                    obj[key] = newValue;
                }
            }
        }
        return obj;
    }
}

var GLOBAL_SCOPE = this;

/**
 * Represents the graph types, aka asset collection types, of the system.
 */
class GraphType {

    constructor(uri) {
        this._uri = uri;
    }

    /**
     * Gets the plural display label, e.g. "Ontologies".
     * @returns {string}
     */
    get pluralLabel() {
        return graph.eval('teamwork:pluralProjectTypeLabel(?projectType)', { projectType: { uri: this.uri }})
    }

    /**
     * Gets the singular display label, e.g. "Ontology".
     * @returns {string}
     */
    get singularLabel() {
        return graph.eval('teamwork:singularProjectTypeLabel(?projectType)', { projectType: { uri: this.uri }})
    }

    /**
     * The URI of this graph type, e.g. 'http://edg.topbraid.solutions/model/DataAssetsProjectType' for Data Asset collections.
     * @returns {string}
     */
    get uri() {
        return this._uri;
    }
}
Object.defineProperty(GraphType.prototype, 'pluralLabel', {enumerable: true});
Object.defineProperty(GraphType.prototype, 'singularLabel', {enumerable: true});
Object.defineProperty(GraphType.prototype, 'uri', {enumerable: true});

/**
 * An API to access common I/O operations including the ability to work with uploaded files and making HTTP requests.
 */
const IO = {

    /**
     * If IO.debug logging has been activated, this will print the given arguments similar to console.debug()
     * into the console and into the server log.
     */
    debug() {
        let array = [];
        for(let i = 0; i < arguments.length; i++) {
            array.push(arguments[i]);
        }
        __jenaData.debug(array);
    },

    /**
     * @typedef {Object} HttpResponse
     * @property {number} status - The HTTP status code, e.g. 200 for OK
     * @property {number} statusText - The HTTP status message, e.g. "OK"
     * @property {Object} data - The response data if present and toFile was not true. Will be parsed JSON if response mime type contains 'json' and the result can be parsed OK.
     * @property {string} file - The file ID if toFile was set to true
     * @property {Object} headers - The response headers
     */

    /**
     * Performs a HTTP request and either returns the response or writes the response into a (temporary) file that
     * can be processed separately.
     * The API is similar to Axios but waits until the request has completed.
     * This function can be disabled by the server setup configuration disableADSHTTP=true.
	 * @param {Object} request - the request descriptor
     * @param {string} request.url - The URL to send the request to.
     * @param {string} [request.baseURL] - Will be prepended to url (for convenience).
     * @param {string} [request.method] - The request method such as 'post', defaulting to 'get'
     * @param {Object} [request.headers] - Name-value pairs for HTTP request headers.
     * @param {Object} [request.params] - Name-value pairs for the HTTP request parameters.
     * @param {string} [request.data] - The request body data. Only applicable for PUT, POST, DELETE and PATCH.
     * @param {string} [request.contentType] - Overrides the default content type, which is text/plain if data is specified, or application/x-www-form-urlencoded otherwise.
     * @param {string} [request.username] - The user name for HTTP Basic authentication.
	 * @param {string} [request.password] - The password to use for authentication. If left empty, and authentication is
     *                      enabled (if userName is present), then the password will be retrieved from Secure Storage.
     * @param {string} [request.securePasswordURL] - When retrieving the password from Secure Storage, get the password for
     *                      this URL instead of the password for url. Only allowed if the request URL (url) starts with
     *                      the securePasswordURL.
     * @param {string} [request.toFileSuffix] - If present, the response body will be saved as a file that can the accessed using
     *                      IO.uploadedFile().  The response JSON will include the file ID as value of the 'file' field.
     *                      The value will be used as file suffix. For example if you are downloading a TSV file, use 'tsv' so
     *                      that IO.uploadedFile(response.file).asSpreadsheet() does the right thing.
     * @returns {HttpResponse} response The HTTP response as an object
     */
    http(request) {
        let result = __jenaData.http(request);
        if(result.data && result.headers) {
            let ct = result.headers['content-type'];
            if(ct && ct.indexOf('json') > 0) {
                try {
                    let json = JSON.parse(result.data);
                    result.data = json;
                }
                catch(ex) {
                    // Ignore
                }
            }
        }
        return result;
    },

    /**
     * Parses the text of an RDF file (e.g., in Turtle format) and places them into a fresh temporary graph
     * that can then be queried further, e.g. using graph.withDataGraph or SPARQL's GRAPH keyword.
     * @param {string} text - the content of the file to parse, e.g. retrieved using IO.uploadedFile(file).text
     * @param {string} [serialization] - A content type such as "application/rdf+xml" defaulting to Turtle+
     * @returns {string} the URI of a temp graph that contains the resulting RDF triples and prefixes
     */
    parseRDF(text, serialization) {
        return __jenaData.parseRDF(text, serialization);
    },

    /**
     * Produces a string in Turtle or RDF/XML serialization for a graph consisting of the provided triples.
     * @param {Triple[]} triples - An array of { subject, predicate, object } objects where each value is a NamedNode or
     *                      LiteralNode or primitive value at the object position
     * @param {string} [responseType] - Either text/turtle (default) or application/rdf+xml
     * @returns {string} the serialized triples
     */
    serializeRDF(triples, responseType) {
        return __jenaData.serializeRDF(triples, responseType);
    },

    /**
     * For use within ADS-based web services, this sets the HTTP response status code that will be used when the\
     * service ends normally.  Defaults to 200.
     * @param {number} code  - the new status code or undefined/null to do nothing
     */
    setResponseStatusCode(code) {
        __jenaData.setResponseStatusCode(code);
    },
    
    /**
     * Gets an uploaded file from a provided ID.
     * @param {string} fileId - the ID of the file, typically provided as parameter value from an Action
     * @returns {UploadedFile}
     */
    uploadedFile(fileId) {
    	return new UploadedFile(fileId);
    },
}

/**
 * The SQL object can be used to query a relational database using Active Data Shapes.
 * This API can be disabled by the server setup configuration disableADSSQL=true.
 */
const SQL = {
	
	/**
	 * Performs an SQL query against a database (specified by a connection object) and returns the result set
	 * rows as an array of name-value pairs.
	 * @param {Object} conn - the connection descriptor
	 * @param {string} conn.url - the URL of the database server
	 * @param {?string} [conn.user] - the name of the user
	 * @param {?string} [conn.password] - the password
	 * @param {string} sql - the SQL query string
	 * @returns {Object[]} an array of name-value pairs
	 */
	query: (conn, sql) => {
		return __jenaData.sqlQuery(conn, sql);
	},
	
	/**
	 * Performs an SQL update against a database (specified by a connection object).
	 * @param {Object} conn - the connection descriptor
	 * @param {string} conn.url - the URL of the database server
	 * @param {?string} [conn.user] - the name of the user
	 * @param {?string} [conn.password] - the password
	 * @param {string} sql - the SQL update string
	 */
	update: (conn, sql) => {
		__jenaData.sqlUpdate(conn, sql);
	}
}

/**
 * The class of (uploaded) files, providing access to the content, mime type etc.
 * The typical workflow is that a dash:Action requests a user to upload a file by setting dash:mimeTypes
 * on one of its parameters, and keeps its ID as a reference.
 * That fileId string is used to construct instances of this class here.
 * 
 * The name is not simply 'File' to avoid clashes with the namesake class from the W3C Web API.
 */
class UploadedFile {

	/**
	 * Constructs a new instance based on a file ID.
	 */
	constructor(fileId) {
		this.fileId = fileId;
	}
	
	/**
	 * Assuming this file represents a spreadsheet, cast it into a Spreadsheet instance.
	 * This is only supported for files with suitable mime types.
     * Note this will load the whole spreadsheet into memory but provides random access to all rows and cells.
     * @param {string} [encoding] - the optional file encoding, defaulting to UTF-8
	 * @returns {UploadedSpreadsheet}
	 */
	asSpreadsheet(encoding) {
		let __spreadsheet = __jenaData.uploadedFile(this.fileId).asSpreadsheet(encoding);
		return new UploadedSpreadsheet(__spreadsheet);
	}

	/**
	 * Assuming this file represents a .csv or .tsv spreadsheet, cast it into a SpreadsheetIterator instance.
     * Use this if your spreadsheet is potentially very large.
     * @param {string} [encoding] - the optional file encoding, defaulting to UTF-8
	 * @returns {SpreadsheetIterator}
	 */
    asSpreadsheetIterator(encoding) {
		let __iterator = __jenaData.uploadedFile(this.fileId).asSpreadsheetIterator(__jenaData, encoding);
		return new SpreadsheetIterator(__iterator);
    }

	/**
	 * Assuming this file is a valid XML document, cast it into an XMLNode.
	 * @returns {XMLNode}
	 */
	asXML() {
		return new XMLNode(__jenaData.uploadedFile(this.fileId).asXML());
	}
	
	/**
	 * Gets the (client) name under which this file was uploaded to the server.
	 * @returns {string}
	 */
	get name() {
		return __jenaData.uploadedFile(this.fileId).name();
	}
	
	/**
	 * Assuming this is a text file (e.g. JSON, XML, HTML, CSV), this gets the content of the file as a string.
     * @returns {string}
	 */
	get text() {
		return __jenaData.uploadedFile(this.fileId).text();
	}
	
	/**
	 * Gets the mime type of the file as a string.
     * @returns {string}
	 */
	get type() {
		return __jenaData.uploadedFile(this.fileId).type();
	}
}
Object.defineProperty(UploadedFile.prototype, 'name', {enumerable: true});
Object.defineProperty(UploadedFile.prototype, 'text', {enumerable: true});
Object.defineProperty(UploadedFile.prototype, 'type', {enumerable: true});


/**
 * The class of spreadsheets that are opened in a streaming fashion, row by row.
 * Use UploadedFile.asSpreadsheetIterator() to create instances.
 * This class implements the Iterable protocol, e.g. use for(const row of s) { ... } to iterate over all rows.
 */
class SpreadsheetIterator {
	
	constructor(__iterator) {
		this.__iterator = __iterator;
	}

    /**
     * Closes the iterator, immediately releasing any file handles and memory that it might hold on to.
     * This is otherwise done automatically by the end of the surrounding script.
     */
    close() {
        this.__iterator.close();
    }
	
	/**
	 * The names of the columns.
	 * @returns {string[]}
	 */
	get columnNames() {
		return this.__iterator.columnNames();
	}

    /**
     * Gets the next item, following the JavaScript Iterator protocol.
     */
    next() {
        let row = this.__iterator.next();
        if(row) {
            return {
                done: false,
                value: row,
            }
        }
        else {
            return {
                done: true
            }
        }
    }

    [Symbol.iterator]() {
        this.__iterator.close();
        return this;
    }
}
Object.defineProperty(SpreadsheetIterator.prototype, 'columnNames', {enumerable: true});


/**
 * The class of (uploaded) Spreadsheets, providing access to the columns, rows etc.
 * Use UploadedFile.asSpreadsheet() to create instances.
 */
class UploadedSpreadsheet {
	
	constructor(__spreadsheet) {
		this.__spreadsheet = __spreadsheet;
	}
		
	/**
	 * Gets the value in a given row and column, as a string, number, boolean or LiteralNode.
	 * @param {number} rowIndex - the index of the row, starting at 0
	 * @param {number} [columnIndex] - the index of the column, starting at 0, defaulting to 0
	 * @param {number} [sheetIndex] - the index of the sheet, starting at 0, defaulting to 0
     * @returns {boolean|number|string|LiteralNode}
	 */
	cell(rowIndex, columnIndex, sheetIndex) {
		return RDFNodeUtil.castValue(this.__spreadsheet.cell(rowIndex, columnIndex || 0, sheetIndex || 0));
	}
	
	/**
	 * Gets the names of the columns on a given sheet.
	 * @param {number} [sheetIndex] - the index of the sheet, starting at 0, defaulting to 0
	 * @returns {string[]}
	 */
	columnNames(sheetIndex) {
		let array = this.__spreadsheet.columnNames(sheetIndex || 0);
		let results = []; // Copy into proper JavaScript array, not the Graal pseudo-array
		for(let i = 0; i < array.length; i++) {
			results.push(array[i]);
		}
		return results;
	}
	
	/**
	 * Gets the number of rows on a given sheet.
	 * @param {number} [sheetIndex] - the index of the sheet, starting at 0, defaulting to 0
	 * @returns {number}
	 */
	rowCount(sheetIndex) {
		return this.__spreadsheet.rowCount(sheetIndex || 0);
	}
	
	/**
	 * Gets a given row as a JavaScript object, with the column names as object keys
	 * and strings, numbers, booleans or LiteralNodes as values.
	 * @param {number} rowIndex - the index of the row, starting at 0
	 * @param {number} [sheetIndex] - the index of the sheet, starting at 0, defaulting to 0
	 * @returns {Object}
	 */
	row(rowIndex, sheetIndex) {
		return RDFNodeUtil.castObject(this.__spreadsheet.row(rowIndex, sheetIndex || 0));
	}
	
	/**
	 * Gets all rows as an array of JavaScript objects, as in the row function.
	 * @param {number} [sheetIndex] - the index of the sheet, starting at 0, defaulting to 0
	 * @returns {Object[]}
	 */
	rows(sheetIndex) {
		let rows = [];
		let count = this.rowCount(sheetIndex);
		for(let i = 0; i < count; i++) {
			rows.push(this.row(i, sheetIndex));
		}
		return rows;
	}
	
	/**
	 * Gets the names of the sheets (at least one) as a string array.
	 * @returns {string[]}
	 */
	sheetNames() {
		let array = this.__spreadsheet.sheetNames();
		let results = []; // Copy into proper JavaScript array, not the Graal pseudo-array
		for(let i = 0; i < array.length; i++) {
			results.push(array[i]);
		}
		return results;
	}
}


/**
 * Represents an XML DOM Node as delivered by UploadedFile.asXML().
 * In addition to the declared fields and methods, nodes that represent elements have all attributes
 * of the XML node as direct properties.
 * If attribute names clash with declared fields or methods then an underscore is appended.
 */
class XMLNode {
	
	constructor(zzzNode) {
		this.zzzNode = zzzNode;
		if(zzzNode.isElement()) {
			let as = zzzNode.attributes();
			Object.assign(this, as);
		}
	}
	
	/**
	 * Gets the child nodes as instances of XMLNode.
	 * @returns {XMLNode[]}
	 */
	get childNodes() {
		let nodes = this.zzzNode.childNodes();
		let array = [];
		for(let i = 0; i < nodes.length; i++) {
			array.push(new XMLNode(nodes[i]));
		}
		return array;
	}
	
	/**
	 * Checks if this node represents a CDATA section.
	 * @returns {boolean}
	 */
	isCDATASection() {
		return this.zzzNode.isCDATASection();
	}
	
	/**
	 * Checks if this node represents a Comment.
	 * @returns {boolean}
	 */
	isComment() {
		return this.zzzNode.isComment();
	}
	
	/**
	 * Checks if this node represents an element.
	 * @returns {boolean}
	 */
	isElement() {
		return this.zzzNode.isElement();
	}
	
	/**
	 * Checks if this node represents a text node.
	 * @returns {boolean}
	 */
	isText() {
		return this.zzzNode.isText();
	}
	
	/**
	 * Returns the local name.
	 * See https://docs.oracle.com/javase/8/docs/api/org/w3c/dom/Node.html#getLocalName--
	 * @returns {string}
	 */
	get localName() {
		return this.zzzNode.localName();
	}
	
	/**
	 * Returns the namespace URI.
	 * See https://docs.oracle.com/javase/8/docs/api/org/w3c/dom/Node.html#getNamespaceURI--
	 * @returns {string}
	 */
	get namespaceURI() {
		return this.zzzNode.namespaceURI();
	}
	
	/**
	 * Gets the node name, e.g. the tag name for element nodes.
	 * See https://docs.oracle.com/javase/8/docs/api/org/w3c/dom/Node.html#getNodeName--
	 * @returns {string}
	 */
	get nodeName() {
		return this.zzzNode.nodeName();
	}
	
	/**
	 * Gets the node value, e.g. the content of a text node.
	 * See https://docs.oracle.com/javase/8/docs/api/org/w3c/dom/Node.html#getNodeValue--
	 * @returns {string}
	 */
	get nodeValue() {
		return this.zzzNode.nodeValue();
	}
	
	/**
	 * Returns the prefix.
	 * See https://docs.oracle.com/javase/8/docs/api/org/w3c/dom/Node.html#getPrefix--
	 * @returns {string}
	 */
	get prefix() {
		return this.zzzNode.prefix();
	}
	
	/**
	 * Gets the text context of this node and its descendants.
	 * See https://docs.oracle.com/javase/8/docs/api/org/w3c/dom/Node.html#getTextContent--
	 * @returns {string}
	 */
	get textContent() {
		return this.zzzNode.textContent();
	}
	
	/**
	 * Gets the first result of an XPath expression starting with this node, or null.
	 * Attribute values are returned as plain strings.
	 * @param {string} xpath - the XPath expression
	 * @returns {XMLNode|string}
	 */
	xpathNode(xpath) {
		let nodes = this.xpathNodes(xpath);
		return nodes.length > 0 ? nodes[0] : null;
	}
	
	/**
	 * Gets all results of an XPath expression starting with this node.
	 * Attribute values are returned as plain strings.
	 * @param {string} xpath - the XPath expression
	 * @returns {XMLNode|string[]}
	 */
	xpathNodes(xpath) {
		let nodes = this.zzzNode.xpath(xpath);
		let array = [];
		for(let i = 0; i < nodes.length; i++) {
			array.push(typeof nodes[i] == 'string' ? nodes[i] : new XMLNode(nodes[i]));
		}
		return array;
	}	
}
Object.defineProperty(XMLNode.prototype, 'childNodes', {enumerable: true});
Object.defineProperty(XMLNode.prototype, 'localName', {enumerable: true});
Object.defineProperty(XMLNode.prototype, 'namespaceURI', {enumerable: true});
Object.defineProperty(XMLNode.prototype, 'nodeName', {enumerable: true});
Object.defineProperty(XMLNode.prototype, 'nodeValue', {enumerable: true});
Object.defineProperty(XMLNode.prototype, 'prefix', {enumerable: true});
Object.defineProperty(XMLNode.prototype, 'textContent', {enumerable: true});





/**
 * Generated from the namespace <http://jena.hpl.hp.com/ARQ/function#>
 */
const afn = {

	/**
	 * Returns the local name of a URI resource. Based on splitting the IRI, not on any prefixes in the query or dataset. For example, the local name of http://test.com/my#Example is Example.
	 * @param {NamedNode} arg1  the URI resource to get the local name of
	 * @returns {string}
	 */
	localname(arg1) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://jena.hpl.hp.com/ARQ/function#localname", arg1), null);
	},
	
	/**
	 * Gets the max value of two numeric arguments.
	 * @param {NamedNode} arg1  the first value to compare
	 * @param {NamedNode} arg2  the second value to compare
	 * @returns {LiteralNode}
	 */
	max(arg1, arg2) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://jena.hpl.hp.com/ARQ/function#max", arg1, arg2), NamedNode);
	},
	
	/**
	 * Gets the min value of two numeric arguments.
	 * @param {NamedNode} arg1  the first value to compare
	 * @param {NamedNode} arg2  the second value to compare
	 * @returns {LiteralNode}
	 */
	min(arg1, arg2) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://jena.hpl.hp.com/ARQ/function#min", arg1, arg2), NamedNode);
	},
	
	/**
	 * Returns the namespace of a URI resource. Based on splitting the IRI, not on any prefixes in the query or dataset. For example, the namespace of http://test.com/my#Example is http://test.com/my#.
	 * @param {NamedNode} arg1  the URI resource to get the namespace of
	 * @returns {string}
	 */
	namespace(arg1) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://jena.hpl.hp.com/ARQ/function#namespace", arg1), null);
	},
	
	/**
	 * Gets the current time as xsd:dateTime.  Actually, the time the query started. Constant throughout a query execution.
	 * @returns {LiteralNode}
	 */
	now() {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://jena.hpl.hp.com/ARQ/function#now"), null);
	},
	
	/**
	 * Make a string from the format string and the RDF terms.
	 * @param {string} arg1  The format
	 * @returns {string}
	 */
	sprintf(arg1) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://jena.hpl.hp.com/ARQ/function#sprintf", arg1), null);
	},
	
	
	NS: "http://jena.hpl.hp.com/ARQ/function#",
	PREFIX: "afn",
}


/**
 * Generated from the namespace <http://datashapes.org/dash#>
 */
const dash = {

	/**
	 * Converts a value into an instance of dash_ConstraintReificationShape
	 * @param {?GraphNode|?string|?boolean|?number} obj - the node or URI string to convert
	 * @returns {?dash_ConstraintReificationShape} the converted node or null if the input was not a string or object
	 */
	asConstraintReificationShape: (obj) => {
		return obj == null || typeof obj == 'boolean' || typeof obj == 'number' ? null : new dash_ConstraintReificationShape(obj);
	},
	
	/**
	 * Converts an array of values into an array of instances of dash_ConstraintReificationShape
	 * @param {(GraphNode|string|boolean|number)[]} objs - the nodes or URI strings to convert
	 * @returns {dash_ConstraintReificationShape[]} the converted nodes
	 */
	asConstraintReificationShapeArray: (objs) => {
		return objs.filter(obj => typeof obj != 'boolean' && typeof obj != 'number').map(obj => new dash_ConstraintReificationShape(obj));
	},
	
	/**
	 * Converts a value into an instance of dash_ShapeClass
	 * @param {?GraphNode|?string|?boolean|?number} obj - the node or URI string to convert
	 * @returns {?dash_ShapeClass} the converted node or null if the input was not a string or object
	 */
	asShapeClass: (obj) => {
		return obj == null || typeof obj == 'boolean' || typeof obj == 'number' ? null : new dash_ShapeClass(obj);
	},
	
	/**
	 * Converts an array of values into an array of instances of dash_ShapeClass
	 * @param {(GraphNode|string|boolean|number)[]} objs - the nodes or URI strings to convert
	 * @returns {dash_ShapeClass[]} the converted nodes
	 */
	asShapeClassArray: (objs) => {
		return objs.filter(obj => typeof obj != 'boolean' && typeof obj != 'number').map(obj => new dash_ShapeClass(obj));
	},
	
	/**
	 * Creates a new instance of dash_ShapeClass based on initial property values.
	 * @param {dash_ShapeClass_Props} props - name-value pairs for the initial properties
	 * @returns {dash_ShapeClass}
	 */
	createShapeClass: (props) => {
		return RDFNodeUtil.createInstance(dash_ShapeClass, 'http://datashapes.org/dash#ShapeClass', props);
	},
	
	/**
	 * Gets all instances of the class dash:ScriptRule in the data graph.
	 * @returns {NamedNode[]} all instances including those of subclasses
	 */
	everyScriptRule: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://datashapes.org/dash#ScriptRule"), NamedNode);
	},
	
	/**
	 * Gets all instances of the class dash:ShapeClass in the data graph.
	 * @returns {dash_ShapeClass[]} all instances including those of subclasses
	 */
	everyShapeClass: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://datashapes.org/dash#ShapeClass"), dash_ShapeClass);
	},
	
	/**
	 * Checks whether a given shape or constraint has been marked as "deactivated" using sh:deactivated.
	 * @param constraintOrShape  The sh:Constraint or sh:Shape to test.
	 * @returns {boolean}
	 */
	isDeactivated(constraintOrShape) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://datashapes.org/dash#isDeactivated", constraintOrShape), null);
	},
	
	/**
	 * Checks if a given sh:NodeKind is one that includes BlankNodes.
	 * @param {NamedNode} nodeKind  The sh:NodeKind to check.
	 * @returns {boolean}
	 */
	isNodeKindBlankNode(nodeKind) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://datashapes.org/dash#isNodeKindBlankNode", nodeKind), null);
	},
	
	/**
	 * Checks if a given sh:NodeKind is one that includes IRIs.
	 * @param {NamedNode} nodeKind  The sh:NodeKind to check.
	 * @returns {boolean}
	 */
	isNodeKindIRI(nodeKind) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://datashapes.org/dash#isNodeKindIRI", nodeKind), null);
	},
	
	/**
	 * Checks if a given sh:NodeKind is one that includes Literals.
	 * @param {NamedNode} nodeKind  The sh:NodeKind to check.
	 * @returns {boolean}
	 */
	isNodeKindLiteral(nodeKind) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://datashapes.org/dash#isNodeKindLiteral", nodeKind), null);
	},
	
	/**
	 * Returns true if a given class (first argument) is a subclass of a given other class (second argument), or identical to that class. This is equivalent to an rdfs:subClassOf* check.
	 * @param {rdfs_Class} subclass  The (potential) subclass.
	 * @param {rdfs_Class} superclass  The (potential) superclass.
	 * @returns {boolean}
	 */
	isSubClassOf(subclass, superclass) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://datashapes.org/dash#isSubClassOf", subclass, superclass), null);
	},
	
	/**
	 * Inserts a given value into a given URI template, producing a new xsd:anyURI literal.
	 * 
	 * In the future this should support RFC 6570 but for now it is limited to simple {...} patterns.
	 * @param {string} template  The URI template, e.g. "http://example.org/{symbol}".
	 * @param value  The literal value to insert into the template. Will use the URI-encoded string of the lexical form (for now).
	 * @returns {LiteralNode}
	 */
	uriTemplate(template, value) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://datashapes.org/dash#uriTemplate", template, value), null);
	},
	
	/**
	 * Computes the number of objects for a given subject/predicate combination.
	 * @param {NamedNode} subject  The subject to get the number of objects of.
	 * @param {NamedNode} predicate  The predicate to get the number of objects of.
	 * @returns {number}
	 */
	valueCount(subject, predicate) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://datashapes.org/dash#valueCount", subject, predicate), null);
	},
	
	get abstract() { return new rdf_Property("http://datashapes.org/dash#abstract") },
	get action() { return new rdf_Property("http://datashapes.org/dash#action") },
	get actionGroup() { return new rdf_Property("http://datashapes.org/dash#actionGroup") },
	get actionIconClass() { return new rdf_Property("http://datashapes.org/dash#actionIconClass") },
	get addedTriple() { return new rdf_Property("http://datashapes.org/dash#addedTriple") },
	get apiStatus() { return new rdf_Property("http://datashapes.org/dash#apiStatus") },
	get applicableToClass() { return new rdf_Property("http://datashapes.org/dash#applicableToClass") },
	get cachable() { return new rdf_Property("http://datashapes.org/dash#cachable") },
	get canWrite() { return new rdf_Property("http://datashapes.org/dash#canWrite") },
	get closedByTypes() { return new rdf_Property("http://datashapes.org/dash#closedByTypes") },
	get coExistsWith() { return new rdf_Property("http://datashapes.org/dash#coExistsWith") },
	get composite() { return new rdf_Property("http://datashapes.org/dash#composite") },
	get constructor() { return new rdf_Property("http://datashapes.org/dash#constructor") },
	get contextFree() { return new rdf_Property("http://datashapes.org/dash#contextFree") },
	get defaultLang() { return new rdf_Property("http://datashapes.org/dash#defaultLang") },
	get defaultViewForRole() { return new rdf_Property("http://datashapes.org/dash#defaultViewForRole") },
	get deletedTriple() { return new rdf_Property("http://datashapes.org/dash#deletedTriple") },
	get dependencyPredicate() { return new rdf_Property("http://datashapes.org/dash#dependencyPredicate") },
	get detailsEndpoint() { return new rdf_Property("http://datashapes.org/dash#detailsEndpoint") },
	get detailsGraph() { return new rdf_Property("http://datashapes.org/dash#detailsGraph") },
	get editor() { return new rdf_Property("http://datashapes.org/dash#editor") },
	get expectedResult() { return new rdf_Property("http://datashapes.org/dash#expectedResult") },
	get expectedResultIsJSON() { return new rdf_Property("http://datashapes.org/dash#expectedResultIsJSON") },
	get expectedResultIsTTL() { return new rdf_Property("http://datashapes.org/dash#expectedResultIsTTL") },
	get exports() { return new rdf_Property("http://datashapes.org/dash#exports") },
	get expression() { return new rdf_Property("http://datashapes.org/dash#expression") },
	get fixed() { return new rdf_Property("http://datashapes.org/dash#fixed") },
	get focusNode() { return new rdf_Property("http://datashapes.org/dash#focusNode") },
	get generateClass() { return new rdf_Property("http://datashapes.org/dash#generateClass") },
	get generatePrefixClasses() { return new rdf_Property("http://datashapes.org/dash#generatePrefixClasses") },
	get generatePrefixConstants() { return new rdf_Property("http://datashapes.org/dash#generatePrefixConstants") },
	get hasSideEffects() { return new rdf_Property("http://datashapes.org/dash#hasSideEffects") },
	get hasValueIn() { return new rdf_Property("http://datashapes.org/dash#hasValueIn") },
	get hasValueWithClass() { return new rdf_Property("http://datashapes.org/dash#hasValueWithClass") },
	get height() { return new rdf_Property("http://datashapes.org/dash#height") },
	get hidden() { return new rdf_Property("http://datashapes.org/dash#hidden") },
	get includeSuggestions() { return new rdf_Property("http://datashapes.org/dash#includeSuggestions") },
	get index() { return new rdf_Property("http://datashapes.org/dash#index") },
	get indexed() { return new rdf_Property("http://datashapes.org/dash#indexed") },
	get js() { return new rdf_Property("http://datashapes.org/dash#js") },
	get jsCondition() { return new rdf_Property("http://datashapes.org/dash#jsCondition") },
	get localConstraint() { return new rdf_Property("http://datashapes.org/dash#localConstraint") },
	get mimeTypes() { return new rdf_Property("http://datashapes.org/dash#mimeTypes") },
	get neverMaterialize() { return new rdf_Property("http://datashapes.org/dash#neverMaterialize") },
	get nonRecursive() { return new rdf_Property("http://datashapes.org/dash#nonRecursive") },
	get onAllFocusNodes() { return new rdf_Property("http://datashapes.org/dash#onAllFocusNodes") },
	get onAllValues() { return new rdf_Property("http://datashapes.org/dash#onAllValues") },
	get propertyRole() { return new rdf_Property("http://datashapes.org/dash#propertyRole") },
	get propertySuggestionGenerator() { return new rdf_Property("http://datashapes.org/dash#propertySuggestionGenerator") },
	get readOnly() { return new rdf_Property("http://datashapes.org/dash#readOnly") },
	get reifiableBy() { return new rdf_Property("http://datashapes.org/dash#reifiableBy") },
	get reificationRequired() { return new rdf_Property("http://datashapes.org/dash#reificationRequired") },
	get resourceAction() { return new rdf_Property("http://datashapes.org/dash#resourceAction") },
	get resourceService() { return new rdf_Property("http://datashapes.org/dash#resourceService") },
	get responseContentType() { return new rdf_Property("http://datashapes.org/dash#responseContentType") },
	get responseDescription() { return new rdf_Property("http://datashapes.org/dash#responseDescription") },
	get resultVariable() { return new rdf_Property("http://datashapes.org/dash#resultVariable") },
	get rootClass() { return new rdf_Property("http://datashapes.org/dash#rootClass") },
	get scriptConstraint() { return new rdf_Property("http://datashapes.org/dash#scriptConstraint") },
	get shape() { return new rdf_Property("http://datashapes.org/dash#shape") },
	get shapeScript() { return new rdf_Property("http://datashapes.org/dash#shapeScript") },
	get singleLine() { return new rdf_Property("http://datashapes.org/dash#singleLine") },
	get staticConstraint() { return new rdf_Property("http://datashapes.org/dash#staticConstraint") },
	get stem() { return new rdf_Property("http://datashapes.org/dash#stem") },
	get subSetOf() { return new rdf_Property("http://datashapes.org/dash#subSetOf") },
	get suggestion() { return new rdf_Property("http://datashapes.org/dash#suggestion") },
	get suggestionConfidence() { return new rdf_Property("http://datashapes.org/dash#suggestionConfidence") },
	get suggestionGenerator() { return new rdf_Property("http://datashapes.org/dash#suggestionGenerator") },
	get suggestionGroup() { return new rdf_Property("http://datashapes.org/dash#suggestionGroup") },
	get symmetric() { return new rdf_Property("http://datashapes.org/dash#symmetric") },
	get testCase() { return new rdf_Property("http://datashapes.org/dash#testCase") },
	get testGraph() { return new rdf_Property("http://datashapes.org/dash#testGraph") },
	get uniqueValueForClass() { return new rdf_Property("http://datashapes.org/dash#uniqueValueForClass") },
	get uri() { return new rdf_Property("http://datashapes.org/dash#uri") },
	get uriStart() { return new rdf_Property("http://datashapes.org/dash#uriStart") },
	get validateShapes() { return new rdf_Property("http://datashapes.org/dash#validateShapes") },
	get variables() { return new rdf_Property("http://datashapes.org/dash#variables") },
	get viewer() { return new rdf_Property("http://datashapes.org/dash#viewer") },
	get width() { return new rdf_Property("http://datashapes.org/dash#width") },
	get x() { return new rdf_Property("http://datashapes.org/dash#x") },
	get y() { return new rdf_Property("http://datashapes.org/dash#y") },
	get APIStatus() { return new rdfs_Class("http://datashapes.org/dash#APIStatus") },
	get Action() { return new rdfs_Class("http://datashapes.org/dash#Action") },
	get ActionGroup() { return new rdfs_Class("http://datashapes.org/dash#ActionGroup") },
	get ActionTestCase() { return new rdfs_Class("http://datashapes.org/dash#ActionTestCase") },
	get AllObjectsTarget() { return new rdfs_Class("http://datashapes.org/dash#AllObjectsTarget") },
	get AllSubjectsTarget() { return new rdfs_Class("http://datashapes.org/dash#AllSubjectsTarget") },
	get ChangeScript() { return new rdfs_Class("http://datashapes.org/dash#ChangeScript") },
	get CommitScript() { return new rdfs_Class("http://datashapes.org/dash#CommitScript") },
	get Constructor() { return new rdfs_Class("http://datashapes.org/dash#Constructor") },
	get Editor() { return new rdfs_Class("http://datashapes.org/dash#Editor") },
	get ExploreAction() { return new rdfs_Class("http://datashapes.org/dash#ExploreAction") },
	get FailureResult() { return new rdfs_Class("http://datashapes.org/dash#FailureResult") },
	get FailureTestCaseResult() { return new rdfs_Class("http://datashapes.org/dash#FailureTestCaseResult") },
	get FunctionTestCase() { return new rdfs_Class("http://datashapes.org/dash#FunctionTestCase") },
	get GraphService() { return new rdfs_Class("http://datashapes.org/dash#GraphService") },
	get GraphStoreTestCase() { return new rdfs_Class("http://datashapes.org/dash#GraphStoreTestCase") },
	get GraphUpdate() { return new rdfs_Class("http://datashapes.org/dash#GraphUpdate") },
	get GraphValidationTestCase() { return new rdfs_Class("http://datashapes.org/dash#GraphValidationTestCase") },
	get HasValueTarget() { return new rdfs_Class("http://datashapes.org/dash#HasValueTarget") },
	get IncludedScript() { return new rdfs_Class("http://datashapes.org/dash#IncludedScript") },
	get InferencingTestCase() { return new rdfs_Class("http://datashapes.org/dash#InferencingTestCase") },
	get ModifyAction() { return new rdfs_Class("http://datashapes.org/dash#ModifyAction") },
	get MultiEditor() { return new rdfs_Class("http://datashapes.org/dash#MultiEditor") },
	get MultiFunction() { return new rdfs_Class("http://datashapes.org/dash#MultiFunction") },
	get MultiViewer() { return new rdfs_Class("http://datashapes.org/dash#MultiViewer") },
	get PropertyRole() { return new rdfs_Class("http://datashapes.org/dash#PropertyRole") },
	get QueryTestCase() { return new rdfs_Class("http://datashapes.org/dash#QueryTestCase") },
	get ResourceAction() { return new rdfs_Class("http://datashapes.org/dash#ResourceAction") },
	get ResourceService() { return new rdfs_Class("http://datashapes.org/dash#ResourceService") },
	get SPARQLConstructTemplate() { return new rdfs_Class("http://datashapes.org/dash#SPARQLConstructTemplate") },
	get SPARQLMultiFunction() { return new rdfs_Class("http://datashapes.org/dash#SPARQLMultiFunction") },
	get SPARQLSelectTemplate() { return new rdfs_Class("http://datashapes.org/dash#SPARQLSelectTemplate") },
	get SPARQLUpdateSuggestionGenerator() { return new rdfs_Class("http://datashapes.org/dash#SPARQLUpdateSuggestionGenerator") },
	get Script() { return new rdfs_Class("http://datashapes.org/dash#Script") },
	get ScriptConstraint() { return new rdfs_Class("http://datashapes.org/dash#ScriptConstraint") },
	get ScriptFunction() { return new rdfs_Class("http://datashapes.org/dash#ScriptFunction") },
	get ScriptRule() { return new rdfs_Class("http://datashapes.org/dash#ScriptRule") },
	get ScriptSuggestionGenerator() { return new rdfs_Class("http://datashapes.org/dash#ScriptSuggestionGenerator") },
	get ScriptTestCase() { return new rdfs_Class("http://datashapes.org/dash#ScriptTestCase") },
	get ScriptValidator() { return new rdfs_Class("http://datashapes.org/dash#ScriptValidator") },
	get Service() { return new rdfs_Class("http://datashapes.org/dash#Service") },
	get ShapeClass() { return new rdfs_Class("http://datashapes.org/dash#ShapeClass") },
	get ShapeScript() { return new rdfs_Class("http://datashapes.org/dash#ShapeScript") },
	get SingleEditor() { return new rdfs_Class("http://datashapes.org/dash#SingleEditor") },
	get SingleViewer() { return new rdfs_Class("http://datashapes.org/dash#SingleViewer") },
	get SuccessResult() { return new rdfs_Class("http://datashapes.org/dash#SuccessResult") },
	get SuccessTestCaseResult() { return new rdfs_Class("http://datashapes.org/dash#SuccessTestCaseResult") },
	get Suggestion() { return new rdfs_Class("http://datashapes.org/dash#Suggestion") },
	get SuggestionGenerator() { return new rdfs_Class("http://datashapes.org/dash#SuggestionGenerator") },
	get SuggestionResult() { return new rdfs_Class("http://datashapes.org/dash#SuggestionResult") },
	get TestCase() { return new rdfs_Class("http://datashapes.org/dash#TestCase") },
	get TestCaseResult() { return new rdfs_Class("http://datashapes.org/dash#TestCaseResult") },
	get TestEnvironment() { return new rdfs_Class("http://datashapes.org/dash#TestEnvironment") },
	get ValidationTestCase() { return new rdfs_Class("http://datashapes.org/dash#ValidationTestCase") },
	get Viewer() { return new rdfs_Class("http://datashapes.org/dash#Viewer") },
	get Widget() { return new rdfs_Class("http://datashapes.org/dash#Widget") },
	get ListShape() { return new sh_NodeShape("http://datashapes.org/dash#ListShape") },
	get None() { return new sh_NodeShape("http://datashapes.org/dash#None") },
	get ListNodeShape() { return new sh_NodeShape("http://datashapes.org/dash#ListNodeShape") },
	get ScriptAPIShape() { return new sh_NodeShape("http://datashapes.org/dash#ScriptAPIShape") },
	get ConstraintReificationShape() { return new sh_NodeShape("http://datashapes.org/dash#ConstraintReificationShape") },
	
	NS: "http://datashapes.org/dash#",
	PREFIX: "dash",
}


/**
 * Generated from the namespace <http://www.w3.org/2005/xpath-functions#>
 */
const fn = {

	/**
	 * Returns the absolute value of the argument.
	 * @param {NamedNode} arg1  the number to get the absolute value of
	 * @returns {LiteralNode}
	 */
	abs(arg1) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://www.w3.org/2005/xpath-functions#abs", arg1), NamedNode);
	},
	
	/**
	 * Returns the smallest integer value less than the argument (as a double).
	 * @param {NamedNode} arg1  the number to get the ceiling of
	 * @returns {number}
	 */
	ceiling(arg1) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://www.w3.org/2005/xpath-functions#ceiling", arg1), null);
	},
	
	/**
	 * Returns the greatest integer value less than the argument (as a double).
	 * @param {NamedNode} arg1  the number to get the floor of
	 * @returns {number}
	 */
	floor(arg1) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://www.w3.org/2005/xpath-functions#floor", arg1), null);
	},
	
	/**
	 * Returns the nearest integer value to the argument.
	 * @param {NamedNode} arg1  the number to round
	 * @returns {number}
	 */
	round(arg1) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://www.w3.org/2005/xpath-functions#round", arg1), null);
	},
	
	
	NS: "http://www.w3.org/2005/xpath-functions#",
	PREFIX: "fn",
}


/**
 * Generated from the namespace <http://datashapes.org/graphql#>
 */
const graphql = {

	/**
	 * Converts a value into an instance of graphql_Schema
	 * @param {?GraphNode|?string|?boolean|?number} obj - the node or URI string to convert
	 * @returns {?graphql_Schema} the converted node or null if the input was not a string or object
	 */
	asSchema: (obj) => {
		return obj == null || typeof obj == 'boolean' || typeof obj == 'number' ? null : new graphql_Schema(obj);
	},
	
	/**
	 * Converts an array of values into an array of instances of graphql_Schema
	 * @param {(GraphNode|string|boolean|number)[]} objs - the nodes or URI strings to convert
	 * @returns {graphql_Schema[]} the converted nodes
	 */
	asSchemaArray: (objs) => {
		return objs.filter(obj => typeof obj != 'boolean' && typeof obj != 'number').map(obj => new graphql_Schema(obj));
	},
	
	/**
	 * Creates a new instance of graphql_Schema based on initial property values.
	 * @param {graphql_Schema_Props} props - name-value pairs for the initial properties
	 * @returns {graphql_Schema}
	 */
	createSchema: (props) => {
		return RDFNodeUtil.createInstance(graphql_Schema, 'http://datashapes.org/graphql#Schema', props);
	},
	
	/**
	 * Gets all instances of the class graphql:Schema in the data graph.
	 * @returns {graphql_Schema[]} all instances including those of subclasses
	 */
	everySchema: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://datashapes.org/graphql#Schema"), graphql_Schema);
	},
	
	
	NS: "http://datashapes.org/graphql#",
	PREFIX: "graphql",
}


/**
 * Generated from the namespace <http://www.w3.org/2002/07/owl#>
 */
const owl = {

	/**
	 * Converts a value into an instance of owl_Class
	 * @param {?GraphNode|?string|?boolean|?number} obj - the node or URI string to convert
	 * @returns {?owl_Class} the converted node or null if the input was not a string or object
	 */
	asClass: (obj) => {
		return obj == null || typeof obj == 'boolean' || typeof obj == 'number' ? null : new owl_Class(obj);
	},
	
	/**
	 * Converts an array of values into an array of instances of owl_Class
	 * @param {(GraphNode|string|boolean|number)[]} objs - the nodes or URI strings to convert
	 * @returns {owl_Class[]} the converted nodes
	 */
	asClassArray: (objs) => {
		return objs.filter(obj => typeof obj != 'boolean' && typeof obj != 'number').map(obj => new owl_Class(obj));
	},
	
	/**
	 * Converts a value into an instance of owl_Ontology
	 * @param {?GraphNode|?string|?boolean|?number} obj - the node or URI string to convert
	 * @returns {?owl_Ontology} the converted node or null if the input was not a string or object
	 */
	asOntology: (obj) => {
		return obj == null || typeof obj == 'boolean' || typeof obj == 'number' ? null : new owl_Ontology(obj);
	},
	
	/**
	 * Converts an array of values into an array of instances of owl_Ontology
	 * @param {(GraphNode|string|boolean|number)[]} objs - the nodes or URI strings to convert
	 * @returns {owl_Ontology[]} the converted nodes
	 */
	asOntologyArray: (objs) => {
		return objs.filter(obj => typeof obj != 'boolean' && typeof obj != 'number').map(obj => new owl_Ontology(obj));
	},
	
	/**
	 * Creates a new instance of owl_Class based on initial property values.
	 * @param {owl_Class_Props} props - name-value pairs for the initial properties
	 * @returns {owl_Class}
	 */
	createClass: (props) => {
		return RDFNodeUtil.createInstance(owl_Class, 'http://www.w3.org/2002/07/owl#Class', props);
	},
	
	/**
	 * Creates a new instance of owl_Ontology based on initial property values.
	 * @param {owl_Ontology_Props} props - name-value pairs for the initial properties
	 * @returns {owl_Ontology}
	 */
	createOntology: (props) => {
		return RDFNodeUtil.createInstance(owl_Ontology, 'http://www.w3.org/2002/07/owl#Ontology', props);
	},
	
	/**
	 * Gets all instances of the class owl:AnnotationProperty in the data graph.
	 * @returns {NamedNode[]} all instances including those of subclasses
	 */
	everyAnnotationProperty: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/2002/07/owl#AnnotationProperty"), NamedNode);
	},
	
	/**
	 * Gets all instances of the class owl:AsymmetricProperty in the data graph.
	 * @returns {NamedNode[]} all instances including those of subclasses
	 */
	everyAsymmetricProperty: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/2002/07/owl#AsymmetricProperty"), NamedNode);
	},
	
	/**
	 * Gets all instances of the class owl:Class in the data graph.
	 * @returns {owl_Class[]} all instances including those of subclasses
	 */
	everyClass: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/2002/07/owl#Class"), owl_Class);
	},
	
	/**
	 * Gets all instances of the class owl:DataRange in the data graph.
	 * @returns {NamedNode[]} all instances including those of subclasses
	 */
	everyDataRange: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/2002/07/owl#DataRange"), NamedNode);
	},
	
	/**
	 * Gets all instances of the class owl:DatatypeProperty in the data graph.
	 * @returns {NamedNode[]} all instances including those of subclasses
	 */
	everyDatatypeProperty: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/2002/07/owl#DatatypeProperty"), NamedNode);
	},
	
	/**
	 * Gets all instances of the class owl:DeprecatedClass in the data graph.
	 * @returns {NamedNode[]} all instances including those of subclasses
	 */
	everyDeprecatedClass: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/2002/07/owl#DeprecatedClass"), NamedNode);
	},
	
	/**
	 * Gets all instances of the class owl:DeprecatedProperty in the data graph.
	 * @returns {NamedNode[]} all instances including those of subclasses
	 */
	everyDeprecatedProperty: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/2002/07/owl#DeprecatedProperty"), NamedNode);
	},
	
	/**
	 * Gets all instances of the class owl:FunctionalProperty in the data graph.
	 * @returns {NamedNode[]} all instances including those of subclasses
	 */
	everyFunctionalProperty: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/2002/07/owl#FunctionalProperty"), NamedNode);
	},
	
	/**
	 * Gets all instances of the class owl:InverseFunctionalProperty in the data graph.
	 * @returns {NamedNode[]} all instances including those of subclasses
	 */
	everyInverseFunctionalProperty: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/2002/07/owl#InverseFunctionalProperty"), NamedNode);
	},
	
	/**
	 * Gets all instances of the class owl:IrreflexiveProperty in the data graph.
	 * @returns {NamedNode[]} all instances including those of subclasses
	 */
	everyIrreflexiveProperty: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/2002/07/owl#IrreflexiveProperty"), NamedNode);
	},
	
	/**
	 * Gets all instances of the class owl:ObjectProperty in the data graph.
	 * @returns {NamedNode[]} all instances including those of subclasses
	 */
	everyObjectProperty: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/2002/07/owl#ObjectProperty"), NamedNode);
	},
	
	/**
	 * Gets all instances of the class owl:Ontology in the data graph.
	 * @returns {owl_Ontology[]} all instances including those of subclasses
	 */
	everyOntology: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/2002/07/owl#Ontology"), owl_Ontology);
	},
	
	/**
	 * Gets all instances of the class owl:OntologyProperty in the data graph.
	 * @returns {NamedNode[]} all instances including those of subclasses
	 */
	everyOntologyProperty: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/2002/07/owl#OntologyProperty"), NamedNode);
	},
	
	/**
	 * Gets all instances of the class owl:ReflexiveProperty in the data graph.
	 * @returns {NamedNode[]} all instances including those of subclasses
	 */
	everyReflexiveProperty: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/2002/07/owl#ReflexiveProperty"), NamedNode);
	},
	
	/**
	 * Gets all instances of the class owl:Restriction in the data graph.
	 * @returns {NamedNode[]} all instances including those of subclasses
	 */
	everyRestriction: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/2002/07/owl#Restriction"), NamedNode);
	},
	
	/**
	 * Gets all instances of the class owl:SymmetricProperty in the data graph.
	 * @returns {NamedNode[]} all instances including those of subclasses
	 */
	everySymmetricProperty: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/2002/07/owl#SymmetricProperty"), NamedNode);
	},
	
	/**
	 * Gets all instances of the class owl:TransitiveProperty in the data graph.
	 * @returns {NamedNode[]} all instances including those of subclasses
	 */
	everyTransitiveProperty: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/2002/07/owl#TransitiveProperty"), NamedNode);
	},
	
	get allValuesFrom() { return new rdf_Property("http://www.w3.org/2002/07/owl#allValuesFrom") },
	get annotatedProperty() { return new rdf_Property("http://www.w3.org/2002/07/owl#annotatedProperty") },
	get annotatedSource() { return new rdf_Property("http://www.w3.org/2002/07/owl#annotatedSource") },
	get annotatedTarget() { return new rdf_Property("http://www.w3.org/2002/07/owl#annotatedTarget") },
	get assertionProperty() { return new rdf_Property("http://www.w3.org/2002/07/owl#assertionProperty") },
	get backwardCompatibleWith() { return new rdf_Property("http://www.w3.org/2002/07/owl#backwardCompatibleWith") },
	get bottomDataProperty() { return new rdf_Property("http://www.w3.org/2002/07/owl#bottomDataProperty") },
	get bottomObjectProperty() { return new rdf_Property("http://www.w3.org/2002/07/owl#bottomObjectProperty") },
	get cardinality() { return new rdf_Property("http://www.w3.org/2002/07/owl#cardinality") },
	get complementOf() { return new rdf_Property("http://www.w3.org/2002/07/owl#complementOf") },
	get datatypeComplementOf() { return new rdf_Property("http://www.w3.org/2002/07/owl#datatypeComplementOf") },
	get deprecated() { return new rdf_Property("http://www.w3.org/2002/07/owl#deprecated") },
	get differentFrom() { return new rdf_Property("http://www.w3.org/2002/07/owl#differentFrom") },
	get disjointUnionOf() { return new rdf_Property("http://www.w3.org/2002/07/owl#disjointUnionOf") },
	get disjointWith() { return new rdf_Property("http://www.w3.org/2002/07/owl#disjointWith") },
	get distinctMembers() { return new rdf_Property("http://www.w3.org/2002/07/owl#distinctMembers") },
	get equivalentClass() { return new rdf_Property("http://www.w3.org/2002/07/owl#equivalentClass") },
	get equivalentProperty() { return new rdf_Property("http://www.w3.org/2002/07/owl#equivalentProperty") },
	get hasKey() { return new rdf_Property("http://www.w3.org/2002/07/owl#hasKey") },
	get hasSelf() { return new rdf_Property("http://www.w3.org/2002/07/owl#hasSelf") },
	get hasValue() { return new rdf_Property("http://www.w3.org/2002/07/owl#hasValue") },
	get imports() { return new rdf_Property("http://www.w3.org/2002/07/owl#imports") },
	get incompatibleWith() { return new rdf_Property("http://www.w3.org/2002/07/owl#incompatibleWith") },
	get intersectionOf() { return new rdf_Property("http://www.w3.org/2002/07/owl#intersectionOf") },
	get inverseOf() { return new rdf_Property("http://www.w3.org/2002/07/owl#inverseOf") },
	get maxCardinality() { return new rdf_Property("http://www.w3.org/2002/07/owl#maxCardinality") },
	get maxQualifiedCardinality() { return new rdf_Property("http://www.w3.org/2002/07/owl#maxQualifiedCardinality") },
	get members() { return new rdf_Property("http://www.w3.org/2002/07/owl#members") },
	get minCardinality() { return new rdf_Property("http://www.w3.org/2002/07/owl#minCardinality") },
	get minQualifiedCardinality() { return new rdf_Property("http://www.w3.org/2002/07/owl#minQualifiedCardinality") },
	get onClass() { return new rdf_Property("http://www.w3.org/2002/07/owl#onClass") },
	get onDataRange() { return new rdf_Property("http://www.w3.org/2002/07/owl#onDataRange") },
	get onDatatype() { return new rdf_Property("http://www.w3.org/2002/07/owl#onDatatype") },
	get onProperties() { return new rdf_Property("http://www.w3.org/2002/07/owl#onProperties") },
	get onProperty() { return new rdf_Property("http://www.w3.org/2002/07/owl#onProperty") },
	get oneOf() { return new rdf_Property("http://www.w3.org/2002/07/owl#oneOf") },
	get priorVersion() { return new rdf_Property("http://www.w3.org/2002/07/owl#priorVersion") },
	get propertyChainAxiom() { return new rdf_Property("http://www.w3.org/2002/07/owl#propertyChainAxiom") },
	get propertyDisjointWith() { return new rdf_Property("http://www.w3.org/2002/07/owl#propertyDisjointWith") },
	get qualifiedCardinality() { return new rdf_Property("http://www.w3.org/2002/07/owl#qualifiedCardinality") },
	get sameAs() { return new rdf_Property("http://www.w3.org/2002/07/owl#sameAs") },
	get someValuesFrom() { return new rdf_Property("http://www.w3.org/2002/07/owl#someValuesFrom") },
	get sourceIndividual() { return new rdf_Property("http://www.w3.org/2002/07/owl#sourceIndividual") },
	get targetIndividual() { return new rdf_Property("http://www.w3.org/2002/07/owl#targetIndividual") },
	get targetValue() { return new rdf_Property("http://www.w3.org/2002/07/owl#targetValue") },
	get topDataProperty() { return new rdf_Property("http://www.w3.org/2002/07/owl#topDataProperty") },
	get topObjectProperty() { return new rdf_Property("http://www.w3.org/2002/07/owl#topObjectProperty") },
	get unionOf() { return new rdf_Property("http://www.w3.org/2002/07/owl#unionOf") },
	get versionIRI() { return new rdf_Property("http://www.w3.org/2002/07/owl#versionIRI") },
	get versionInfo() { return new rdf_Property("http://www.w3.org/2002/07/owl#versionInfo") },
	get withRestrictions() { return new rdf_Property("http://www.w3.org/2002/07/owl#withRestrictions") },
	get AllDifferent() { return new rdfs_Class("http://www.w3.org/2002/07/owl#AllDifferent") },
	get AllDisjointClasses() { return new rdfs_Class("http://www.w3.org/2002/07/owl#AllDisjointClasses") },
	get AllDisjointProperties() { return new rdfs_Class("http://www.w3.org/2002/07/owl#AllDisjointProperties") },
	get Annotation() { return new rdfs_Class("http://www.w3.org/2002/07/owl#Annotation") },
	get AnnotationProperty() { return new rdfs_Class("http://www.w3.org/2002/07/owl#AnnotationProperty") },
	get AsymmetricProperty() { return new rdfs_Class("http://www.w3.org/2002/07/owl#AsymmetricProperty") },
	get Axiom() { return new rdfs_Class("http://www.w3.org/2002/07/owl#Axiom") },
	get Class() { return new rdfs_Class("http://www.w3.org/2002/07/owl#Class") },
	get DataRange() { return new rdfs_Class("http://www.w3.org/2002/07/owl#DataRange") },
	get DatatypeProperty() { return new rdfs_Class("http://www.w3.org/2002/07/owl#DatatypeProperty") },
	get DeprecatedClass() { return new rdfs_Class("http://www.w3.org/2002/07/owl#DeprecatedClass") },
	get DeprecatedProperty() { return new rdfs_Class("http://www.w3.org/2002/07/owl#DeprecatedProperty") },
	get FunctionalProperty() { return new rdfs_Class("http://www.w3.org/2002/07/owl#FunctionalProperty") },
	get InverseFunctionalProperty() { return new rdfs_Class("http://www.w3.org/2002/07/owl#InverseFunctionalProperty") },
	get IrreflexiveProperty() { return new rdfs_Class("http://www.w3.org/2002/07/owl#IrreflexiveProperty") },
	get NamedIndividual() { return new rdfs_Class("http://www.w3.org/2002/07/owl#NamedIndividual") },
	get NegativePropertyAssertion() { return new rdfs_Class("http://www.w3.org/2002/07/owl#NegativePropertyAssertion") },
	get Nothing() { return new rdfs_Class("http://www.w3.org/2002/07/owl#Nothing") },
	get ObjectProperty() { return new rdfs_Class("http://www.w3.org/2002/07/owl#ObjectProperty") },
	get Ontology() { return new rdfs_Class("http://www.w3.org/2002/07/owl#Ontology") },
	get OntologyProperty() { return new rdfs_Class("http://www.w3.org/2002/07/owl#OntologyProperty") },
	get ReflexiveProperty() { return new rdfs_Class("http://www.w3.org/2002/07/owl#ReflexiveProperty") },
	get Restriction() { return new rdfs_Class("http://www.w3.org/2002/07/owl#Restriction") },
	get SymmetricProperty() { return new rdfs_Class("http://www.w3.org/2002/07/owl#SymmetricProperty") },
	get Thing() { return new rdfs_Class("http://www.w3.org/2002/07/owl#Thing") },
	get TransitiveProperty() { return new rdfs_Class("http://www.w3.org/2002/07/owl#TransitiveProperty") },
	
	NS: "http://www.w3.org/2002/07/owl#",
	PREFIX: "owl",
}


/**
 * Generated from the namespace <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
 */
const rdf = {

	/**
	 * Converts a value into an instance of rdf_Property
	 * @param {?GraphNode|?string|?boolean|?number} obj - the node or URI string to convert
	 * @returns {?rdf_Property} the converted node or null if the input was not a string or object
	 */
	asProperty: (obj) => {
		return obj == null || typeof obj == 'boolean' || typeof obj == 'number' ? null : new rdf_Property(obj);
	},
	
	/**
	 * Converts an array of values into an array of instances of rdf_Property
	 * @param {(GraphNode|string|boolean|number)[]} objs - the nodes or URI strings to convert
	 * @returns {rdf_Property[]} the converted nodes
	 */
	asPropertyArray: (objs) => {
		return objs.filter(obj => typeof obj != 'boolean' && typeof obj != 'number').map(obj => new rdf_Property(obj));
	},
	
	/**
	 * Creates a new instance of rdf_Property based on initial property values.
	 * @param {rdf_Property_Props} props - name-value pairs for the initial properties
	 * @returns {rdf_Property}
	 */
	createProperty: (props) => {
		return RDFNodeUtil.createInstance(rdf_Property, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#Property', props);
	},
	
	/**
	 * Gets all instances of the class rdf:Property in the data graph.
	 * @returns {rdf_Property[]} all instances including those of subclasses
	 */
	everyProperty: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/1999/02/22-rdf-syntax-ns#Property"), rdf_Property);
	},
	
	get HTML() { return new rdfs_Datatype("http://www.w3.org/1999/02/22-rdf-syntax-ns#HTML") },
	get JSON() { return new rdfs_Datatype("http://www.w3.org/1999/02/22-rdf-syntax-ns#JSON") },
	get XMLLiteral() { return new rdfs_Datatype("http://www.w3.org/1999/02/22-rdf-syntax-ns#XMLLiteral") },
	get langString() { return new rdfs_Datatype("http://www.w3.org/1999/02/22-rdf-syntax-ns#langString") },
	get first() { return new rdf_Property("http://www.w3.org/1999/02/22-rdf-syntax-ns#first") },
	get object() { return new rdf_Property("http://www.w3.org/1999/02/22-rdf-syntax-ns#object") },
	get predicate() { return new rdf_Property("http://www.w3.org/1999/02/22-rdf-syntax-ns#predicate") },
	get rest() { return new rdf_Property("http://www.w3.org/1999/02/22-rdf-syntax-ns#rest") },
	get subject() { return new rdf_Property("http://www.w3.org/1999/02/22-rdf-syntax-ns#subject") },
	get type() { return new rdf_Property("http://www.w3.org/1999/02/22-rdf-syntax-ns#type") },
	get value() { return new rdf_Property("http://www.w3.org/1999/02/22-rdf-syntax-ns#value") },
	get Alt() { return new rdfs_Class("http://www.w3.org/1999/02/22-rdf-syntax-ns#Alt") },
	get Bag() { return new rdfs_Class("http://www.w3.org/1999/02/22-rdf-syntax-ns#Bag") },
	get List() { return new rdfs_Class("http://www.w3.org/1999/02/22-rdf-syntax-ns#List") },
	get Property() { return new rdfs_Class("http://www.w3.org/1999/02/22-rdf-syntax-ns#Property") },
	get Seq() { return new rdfs_Class("http://www.w3.org/1999/02/22-rdf-syntax-ns#Seq") },
	get Statement() { return new rdfs_Class("http://www.w3.org/1999/02/22-rdf-syntax-ns#Statement") },
	
	NS: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
	PREFIX: "rdf",
}


/**
 * Generated from the namespace <http://www.w3.org/2000/01/rdf-schema#>
 */
const rdfs = {

	/**
	 * Converts a value into an instance of rdfs_Class
	 * @param {?GraphNode|?string|?boolean|?number} obj - the node or URI string to convert
	 * @returns {?rdfs_Class} the converted node or null if the input was not a string or object
	 */
	asClass: (obj) => {
		return obj == null || typeof obj == 'boolean' || typeof obj == 'number' ? null : new rdfs_Class(obj);
	},
	
	/**
	 * Converts an array of values into an array of instances of rdfs_Class
	 * @param {(GraphNode|string|boolean|number)[]} objs - the nodes or URI strings to convert
	 * @returns {rdfs_Class[]} the converted nodes
	 */
	asClassArray: (objs) => {
		return objs.filter(obj => typeof obj != 'boolean' && typeof obj != 'number').map(obj => new rdfs_Class(obj));
	},
	
	/**
	 * Converts a value into an instance of rdfs_Datatype
	 * @param {?GraphNode|?string|?boolean|?number} obj - the node or URI string to convert
	 * @returns {?rdfs_Datatype} the converted node or null if the input was not a string or object
	 */
	asDatatype: (obj) => {
		return obj == null || typeof obj == 'boolean' || typeof obj == 'number' ? null : new rdfs_Datatype(obj);
	},
	
	/**
	 * Converts an array of values into an array of instances of rdfs_Datatype
	 * @param {(GraphNode|string|boolean|number)[]} objs - the nodes or URI strings to convert
	 * @returns {rdfs_Datatype[]} the converted nodes
	 */
	asDatatypeArray: (objs) => {
		return objs.filter(obj => typeof obj != 'boolean' && typeof obj != 'number').map(obj => new rdfs_Datatype(obj));
	},
	
	/**
	 * Creates a new instance of rdfs_Class based on initial property values.
	 * @param {rdfs_Class_Props} props - name-value pairs for the initial properties
	 * @returns {rdfs_Class}
	 */
	createClass: (props) => {
		return RDFNodeUtil.createInstance(rdfs_Class, 'http://www.w3.org/2000/01/rdf-schema#Class', props);
	},
	
	/**
	 * Creates a new instance of rdfs_Datatype based on initial property values.
	 * @param {rdfs_Datatype_Props} props - name-value pairs for the initial properties
	 * @returns {rdfs_Datatype}
	 */
	createDatatype: (props) => {
		return RDFNodeUtil.createInstance(rdfs_Datatype, 'http://www.w3.org/2000/01/rdf-schema#Datatype', props);
	},
	
	/**
	 * Gets all instances of the class rdfs:Class in the data graph.
	 * @returns {rdfs_Class[]} all instances including those of subclasses
	 */
	everyClass: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/2000/01/rdf-schema#Class"), rdfs_Class);
	},
	
	/**
	 * Gets all instances of the class rdfs:ContainerMembershipProperty in the data graph.
	 * @returns {NamedNode[]} all instances including those of subclasses
	 */
	everyContainerMembershipProperty: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/2000/01/rdf-schema#ContainerMembershipProperty"), NamedNode);
	},
	
	/**
	 * Gets all instances of the class rdfs:Datatype in the data graph.
	 * @returns {rdfs_Datatype[]} all instances including those of subclasses
	 */
	everyDatatype: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/2000/01/rdf-schema#Datatype"), rdfs_Datatype);
	},
	
	/**
	 * Gets all instances of the class rdfs:Resource in the data graph.
	 * @returns {NamedNode[]} all instances including those of subclasses
	 */
	everyResource: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/2000/01/rdf-schema#Resource"), NamedNode);
	},
	
	get comment() { return new rdf_Property("http://www.w3.org/2000/01/rdf-schema#comment") },
	get domain() { return new rdf_Property("http://www.w3.org/2000/01/rdf-schema#domain") },
	get isDefinedBy() { return new rdf_Property("http://www.w3.org/2000/01/rdf-schema#isDefinedBy") },
	get label() { return new rdf_Property("http://www.w3.org/2000/01/rdf-schema#label") },
	get member() { return new rdf_Property("http://www.w3.org/2000/01/rdf-schema#member") },
	get range() { return new rdf_Property("http://www.w3.org/2000/01/rdf-schema#range") },
	get seeAlso() { return new rdf_Property("http://www.w3.org/2000/01/rdf-schema#seeAlso") },
	get subClassOf() { return new rdf_Property("http://www.w3.org/2000/01/rdf-schema#subClassOf") },
	get subPropertyOf() { return new rdf_Property("http://www.w3.org/2000/01/rdf-schema#subPropertyOf") },
	get Class() { return new rdfs_Class("http://www.w3.org/2000/01/rdf-schema#Class") },
	get Container() { return new rdfs_Class("http://www.w3.org/2000/01/rdf-schema#Container") },
	get ContainerMembershipProperty() { return new rdfs_Class("http://www.w3.org/2000/01/rdf-schema#ContainerMembershipProperty") },
	get Datatype() { return new rdfs_Class("http://www.w3.org/2000/01/rdf-schema#Datatype") },
	get Literal() { return new rdfs_Class("http://www.w3.org/2000/01/rdf-schema#Literal") },
	get Resource() { return new rdfs_Class("http://www.w3.org/2000/01/rdf-schema#Resource") },
	
	NS: "http://www.w3.org/2000/01/rdf-schema#",
	PREFIX: "rdfs",
}


/**
 * Generated from the namespace <http://www.w3.org/ns/shacl#>
 */
const sh = {

	/**
	 * Converts a value into an instance of sh_ConstraintComponent
	 * @param {?GraphNode|?string|?boolean|?number} obj - the node or URI string to convert
	 * @returns {?sh_ConstraintComponent} the converted node or null if the input was not a string or object
	 */
	asConstraintComponent: (obj) => {
		return obj == null || typeof obj == 'boolean' || typeof obj == 'number' ? null : new sh_ConstraintComponent(obj);
	},
	
	/**
	 * Converts an array of values into an array of instances of sh_ConstraintComponent
	 * @param {(GraphNode|string|boolean|number)[]} objs - the nodes or URI strings to convert
	 * @returns {sh_ConstraintComponent[]} the converted nodes
	 */
	asConstraintComponentArray: (objs) => {
		return objs.filter(obj => typeof obj != 'boolean' && typeof obj != 'number').map(obj => new sh_ConstraintComponent(obj));
	},
	
	/**
	 * Converts a value into an instance of sh_NodeShape
	 * @param {?GraphNode|?string|?boolean|?number} obj - the node or URI string to convert
	 * @returns {?sh_NodeShape} the converted node or null if the input was not a string or object
	 */
	asNodeShape: (obj) => {
		return obj == null || typeof obj == 'boolean' || typeof obj == 'number' ? null : new sh_NodeShape(obj);
	},
	
	/**
	 * Converts an array of values into an array of instances of sh_NodeShape
	 * @param {(GraphNode|string|boolean|number)[]} objs - the nodes or URI strings to convert
	 * @returns {sh_NodeShape[]} the converted nodes
	 */
	asNodeShapeArray: (objs) => {
		return objs.filter(obj => typeof obj != 'boolean' && typeof obj != 'number').map(obj => new sh_NodeShape(obj));
	},
	
	/**
	 * Converts a value into an instance of sh_Parameter
	 * @param {?GraphNode|?string|?boolean|?number} obj - the node or URI string to convert
	 * @returns {?sh_Parameter} the converted node or null if the input was not a string or object
	 */
	asParameter: (obj) => {
		return obj == null || typeof obj == 'boolean' || typeof obj == 'number' ? null : new sh_Parameter(obj);
	},
	
	/**
	 * Converts an array of values into an array of instances of sh_Parameter
	 * @param {(GraphNode|string|boolean|number)[]} objs - the nodes or URI strings to convert
	 * @returns {sh_Parameter[]} the converted nodes
	 */
	asParameterArray: (objs) => {
		return objs.filter(obj => typeof obj != 'boolean' && typeof obj != 'number').map(obj => new sh_Parameter(obj));
	},
	
	/**
	 * Converts a value into an instance of sh_Parameterizable
	 * @param {?GraphNode|?string|?boolean|?number} obj - the node or URI string to convert
	 * @returns {?sh_Parameterizable} the converted node or null if the input was not a string or object
	 */
	asParameterizable: (obj) => {
		return obj == null || typeof obj == 'boolean' || typeof obj == 'number' ? null : new sh_Parameterizable(obj);
	},
	
	/**
	 * Converts an array of values into an array of instances of sh_Parameterizable
	 * @param {(GraphNode|string|boolean|number)[]} objs - the nodes or URI strings to convert
	 * @returns {sh_Parameterizable[]} the converted nodes
	 */
	asParameterizableArray: (objs) => {
		return objs.filter(obj => typeof obj != 'boolean' && typeof obj != 'number').map(obj => new sh_Parameterizable(obj));
	},
	
	/**
	 * Converts a value into an instance of sh_PropertyGroup
	 * @param {?GraphNode|?string|?boolean|?number} obj - the node or URI string to convert
	 * @returns {?sh_PropertyGroup} the converted node or null if the input was not a string or object
	 */
	asPropertyGroup: (obj) => {
		return obj == null || typeof obj == 'boolean' || typeof obj == 'number' ? null : new sh_PropertyGroup(obj);
	},
	
	/**
	 * Converts an array of values into an array of instances of sh_PropertyGroup
	 * @param {(GraphNode|string|boolean|number)[]} objs - the nodes or URI strings to convert
	 * @returns {sh_PropertyGroup[]} the converted nodes
	 */
	asPropertyGroupArray: (objs) => {
		return objs.filter(obj => typeof obj != 'boolean' && typeof obj != 'number').map(obj => new sh_PropertyGroup(obj));
	},
	
	/**
	 * Converts a value into an instance of sh_PropertyShape
	 * @param {?GraphNode|?string|?boolean|?number} obj - the node or URI string to convert
	 * @returns {?sh_PropertyShape} the converted node or null if the input was not a string or object
	 */
	asPropertyShape: (obj) => {
		return obj == null || typeof obj == 'boolean' || typeof obj == 'number' ? null : new sh_PropertyShape(obj);
	},
	
	/**
	 * Converts an array of values into an array of instances of sh_PropertyShape
	 * @param {(GraphNode|string|boolean|number)[]} objs - the nodes or URI strings to convert
	 * @returns {sh_PropertyShape[]} the converted nodes
	 */
	asPropertyShapeArray: (objs) => {
		return objs.filter(obj => typeof obj != 'boolean' && typeof obj != 'number').map(obj => new sh_PropertyShape(obj));
	},
	
	/**
	 * Converts a value into an instance of sh_Rule
	 * @param {?GraphNode|?string|?boolean|?number} obj - the node or URI string to convert
	 * @returns {?sh_Rule} the converted node or null if the input was not a string or object
	 */
	asRule: (obj) => {
		return obj == null || typeof obj == 'boolean' || typeof obj == 'number' ? null : new sh_Rule(obj);
	},
	
	/**
	 * Converts an array of values into an array of instances of sh_Rule
	 * @param {(GraphNode|string|boolean|number)[]} objs - the nodes or URI strings to convert
	 * @returns {sh_Rule[]} the converted nodes
	 */
	asRuleArray: (objs) => {
		return objs.filter(obj => typeof obj != 'boolean' && typeof obj != 'number').map(obj => new sh_Rule(obj));
	},
	
	/**
	 * Converts a value into an instance of sh_SPARQLRule
	 * @param {?GraphNode|?string|?boolean|?number} obj - the node or URI string to convert
	 * @returns {?sh_SPARQLRule} the converted node or null if the input was not a string or object
	 */
	asSPARQLRule: (obj) => {
		return obj == null || typeof obj == 'boolean' || typeof obj == 'number' ? null : new sh_SPARQLRule(obj);
	},
	
	/**
	 * Converts an array of values into an array of instances of sh_SPARQLRule
	 * @param {(GraphNode|string|boolean|number)[]} objs - the nodes or URI strings to convert
	 * @returns {sh_SPARQLRule[]} the converted nodes
	 */
	asSPARQLRuleArray: (objs) => {
		return objs.filter(obj => typeof obj != 'boolean' && typeof obj != 'number').map(obj => new sh_SPARQLRule(obj));
	},
	
	/**
	 * Converts a value into an instance of sh_Shape
	 * @param {?GraphNode|?string|?boolean|?number} obj - the node or URI string to convert
	 * @returns {?sh_Shape} the converted node or null if the input was not a string or object
	 */
	asShape: (obj) => {
		return obj == null || typeof obj == 'boolean' || typeof obj == 'number' ? null : new sh_Shape(obj);
	},
	
	/**
	 * Converts an array of values into an array of instances of sh_Shape
	 * @param {(GraphNode|string|boolean|number)[]} objs - the nodes or URI strings to convert
	 * @returns {sh_Shape[]} the converted nodes
	 */
	asShapeArray: (objs) => {
		return objs.filter(obj => typeof obj != 'boolean' && typeof obj != 'number').map(obj => new sh_Shape(obj));
	},
	
	/**
	 * Converts a value into an instance of sh_TargetType
	 * @param {?GraphNode|?string|?boolean|?number} obj - the node or URI string to convert
	 * @returns {?sh_TargetType} the converted node or null if the input was not a string or object
	 */
	asTargetType: (obj) => {
		return obj == null || typeof obj == 'boolean' || typeof obj == 'number' ? null : new sh_TargetType(obj);
	},
	
	/**
	 * Converts an array of values into an array of instances of sh_TargetType
	 * @param {(GraphNode|string|boolean|number)[]} objs - the nodes or URI strings to convert
	 * @returns {sh_TargetType[]} the converted nodes
	 */
	asTargetTypeArray: (objs) => {
		return objs.filter(obj => typeof obj != 'boolean' && typeof obj != 'number').map(obj => new sh_TargetType(obj));
	},
	
	/**
	 * Converts a value into an instance of sh_TripleRule
	 * @param {?GraphNode|?string|?boolean|?number} obj - the node or URI string to convert
	 * @returns {?sh_TripleRule} the converted node or null if the input was not a string or object
	 */
	asTripleRule: (obj) => {
		return obj == null || typeof obj == 'boolean' || typeof obj == 'number' ? null : new sh_TripleRule(obj);
	},
	
	/**
	 * Converts an array of values into an array of instances of sh_TripleRule
	 * @param {(GraphNode|string|boolean|number)[]} objs - the nodes or URI strings to convert
	 * @returns {sh_TripleRule[]} the converted nodes
	 */
	asTripleRuleArray: (objs) => {
		return objs.filter(obj => typeof obj != 'boolean' && typeof obj != 'number').map(obj => new sh_TripleRule(obj));
	},
	
	/**
	 * Creates a new instance of sh_ConstraintComponent based on initial property values.
	 * @param {sh_ConstraintComponent_Props} props - name-value pairs for the initial properties
	 * @returns {sh_ConstraintComponent}
	 */
	createConstraintComponent: (props) => {
		return RDFNodeUtil.createInstance(sh_ConstraintComponent, 'http://www.w3.org/ns/shacl#ConstraintComponent', props);
	},
	
	/**
	 * Creates a new instance of sh_NodeShape based on initial property values.
	 * @param {sh_NodeShape_Props} props - name-value pairs for the initial properties
	 * @returns {sh_NodeShape}
	 */
	createNodeShape: (props) => {
		return RDFNodeUtil.createInstance(sh_NodeShape, 'http://www.w3.org/ns/shacl#NodeShape', props);
	},
	
	/**
	 * Creates a new instance of sh_Parameter based on initial property values.
	 * @param {sh_Parameter_Props} props - name-value pairs for the initial properties
	 * @returns {sh_Parameter}
	 */
	createParameter: (props) => {
		return RDFNodeUtil.createInstance(sh_Parameter, 'http://www.w3.org/ns/shacl#Parameter', props);
	},
	
	/**
	 * Creates a new instance of sh_PropertyGroup based on initial property values.
	 * @param {sh_PropertyGroup_Props} props - name-value pairs for the initial properties
	 * @returns {sh_PropertyGroup}
	 */
	createPropertyGroup: (props) => {
		return RDFNodeUtil.createInstance(sh_PropertyGroup, 'http://www.w3.org/ns/shacl#PropertyGroup', props);
	},
	
	/**
	 * Creates a new instance of sh_PropertyShape based on initial property values.
	 * @param {sh_PropertyShape_Props} props - name-value pairs for the initial properties
	 * @returns {sh_PropertyShape}
	 */
	createPropertyShape: (props) => {
		return RDFNodeUtil.createInstance(sh_PropertyShape, 'http://www.w3.org/ns/shacl#PropertyShape', props);
	},
	
	/**
	 * Creates a new instance of sh_SPARQLRule based on initial property values.
	 * @param {sh_SPARQLRule_Props} props - name-value pairs for the initial properties
	 * @returns {sh_SPARQLRule}
	 */
	createSPARQLRule: (props) => {
		return RDFNodeUtil.createInstance(sh_SPARQLRule, 'http://www.w3.org/ns/shacl#SPARQLRule', props);
	},
	
	/**
	 * Creates a new instance of sh_TripleRule based on initial property values.
	 * @param {sh_TripleRule_Props} props - name-value pairs for the initial properties
	 * @returns {sh_TripleRule}
	 */
	createTripleRule: (props) => {
		return RDFNodeUtil.createInstance(sh_TripleRule, 'http://www.w3.org/ns/shacl#TripleRule', props);
	},
	
	/**
	 * Gets all instances of the class sh:ConstraintComponent in the data graph.
	 * @returns {sh_ConstraintComponent[]} all instances including those of subclasses
	 */
	everyConstraintComponent: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/ns/shacl#ConstraintComponent"), sh_ConstraintComponent);
	},
	
	/**
	 * Gets all instances of the class sh:NodeShape in the data graph.
	 * @returns {sh_NodeShape[]} all instances including those of subclasses
	 */
	everyNodeShape: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/ns/shacl#NodeShape"), sh_NodeShape);
	},
	
	/**
	 * Gets all instances of the class sh:Parameter in the data graph.
	 * @returns {sh_Parameter[]} all instances including those of subclasses
	 */
	everyParameter: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/ns/shacl#Parameter"), sh_Parameter);
	},
	
	/**
	 * Gets all instances of the class sh:Parameterizable in the data graph.
	 * @returns {sh_Parameterizable[]} all instances including those of subclasses
	 */
	everyParameterizable: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/ns/shacl#Parameterizable"), sh_Parameterizable);
	},
	
	/**
	 * Gets all instances of the class sh:PropertyGroup in the data graph.
	 * @returns {sh_PropertyGroup[]} all instances including those of subclasses
	 */
	everyPropertyGroup: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/ns/shacl#PropertyGroup"), sh_PropertyGroup);
	},
	
	/**
	 * Gets all instances of the class sh:PropertyShape in the data graph.
	 * @returns {sh_PropertyShape[]} all instances including those of subclasses
	 */
	everyPropertyShape: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/ns/shacl#PropertyShape"), sh_PropertyShape);
	},
	
	/**
	 * Gets all instances of the class sh:Rule in the data graph.
	 * @returns {sh_Rule[]} all instances including those of subclasses
	 */
	everyRule: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/ns/shacl#Rule"), sh_Rule);
	},
	
	/**
	 * Gets all instances of the class sh:SPARQLRule in the data graph.
	 * @returns {sh_SPARQLRule[]} all instances including those of subclasses
	 */
	everySPARQLRule: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/ns/shacl#SPARQLRule"), sh_SPARQLRule);
	},
	
	/**
	 * Gets all instances of the class sh:SPARQLTargetType in the data graph.
	 * @returns {NamedNode[]} all instances including those of subclasses
	 */
	everySPARQLTargetType: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/ns/shacl#SPARQLTargetType"), NamedNode);
	},
	
	/**
	 * Gets all instances of the class sh:Shape in the data graph.
	 * @returns {sh_Shape[]} all instances including those of subclasses
	 */
	everyShape: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/ns/shacl#Shape"), sh_Shape);
	},
	
	/**
	 * Gets all instances of the class sh:TargetType in the data graph.
	 * @returns {sh_TargetType[]} all instances including those of subclasses
	 */
	everyTargetType: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/ns/shacl#TargetType"), sh_TargetType);
	},
	
	/**
	 * Gets all instances of the class sh:TripleRule in the data graph.
	 * @returns {sh_TripleRule[]} all instances including those of subclasses
	 */
	everyTripleRule: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/ns/shacl#TripleRule"), sh_TripleRule);
	},
	
	get alternativePath() { return new rdf_Property("http://www.w3.org/ns/shacl#alternativePath") },
	get and() { return new rdf_Property("http://www.w3.org/ns/shacl#and") },
	get annotationProperty() { return new rdf_Property("http://www.w3.org/ns/shacl#annotationProperty") },
	get annotationValue() { return new rdf_Property("http://www.w3.org/ns/shacl#annotationValue") },
	get annotationVarName() { return new rdf_Property("http://www.w3.org/ns/shacl#annotationVarName") },
	get ask() { return new rdf_Property("http://www.w3.org/ns/shacl#ask") },
	get class() { return new rdf_Property("http://www.w3.org/ns/shacl#class") },
	get closed() { return new rdf_Property("http://www.w3.org/ns/shacl#closed") },
	get condition() { return new rdf_Property("http://www.w3.org/ns/shacl#condition") },
	get conforms() { return new rdf_Property("http://www.w3.org/ns/shacl#conforms") },
	get construct() { return new rdf_Property("http://www.w3.org/ns/shacl#construct") },
	get count() { return new rdf_Property("http://www.w3.org/ns/shacl#count") },
	get datatype() { return new rdf_Property("http://www.w3.org/ns/shacl#datatype") },
	get deactivated() { return new rdf_Property("http://www.w3.org/ns/shacl#deactivated") },
	get declare() { return new rdf_Property("http://www.w3.org/ns/shacl#declare") },
	get defaultValue() { return new rdf_Property("http://www.w3.org/ns/shacl#defaultValue") },
	get desc() { return new rdf_Property("http://www.w3.org/ns/shacl#desc") },
	get description() { return new rdf_Property("http://www.w3.org/ns/shacl#description") },
	get detail() { return new rdf_Property("http://www.w3.org/ns/shacl#detail") },
	get disjoint() { return new rdf_Property("http://www.w3.org/ns/shacl#disjoint") },
	get distinct() { return new rdf_Property("http://www.w3.org/ns/shacl#distinct") },
	get else() { return new rdf_Property("http://www.w3.org/ns/shacl#else") },
	get entailment() { return new rdf_Property("http://www.w3.org/ns/shacl#entailment") },
	get equals() { return new rdf_Property("http://www.w3.org/ns/shacl#equals") },
	get exists() { return new rdf_Property("http://www.w3.org/ns/shacl#exists") },
	get expression() { return new rdf_Property("http://www.w3.org/ns/shacl#expression") },
	get filterShape() { return new rdf_Property("http://www.w3.org/ns/shacl#filterShape") },
	get flags() { return new rdf_Property("http://www.w3.org/ns/shacl#flags") },
	get focusNode() { return new rdf_Property("http://www.w3.org/ns/shacl#focusNode") },
	get group() { return new rdf_Property("http://www.w3.org/ns/shacl#group") },
	get groupConcat() { return new rdf_Property("http://www.w3.org/ns/shacl#groupConcat") },
	get hasValue() { return new rdf_Property("http://www.w3.org/ns/shacl#hasValue") },
	get if() { return new rdf_Property("http://www.w3.org/ns/shacl#if") },
	get ignoredProperties() { return new rdf_Property("http://www.w3.org/ns/shacl#ignoredProperties") },
	get in() { return new rdf_Property("http://www.w3.org/ns/shacl#in") },
	get intersection() { return new rdf_Property("http://www.w3.org/ns/shacl#intersection") },
	get inversePath() { return new rdf_Property("http://www.w3.org/ns/shacl#inversePath") },
	get labelTemplate() { return new rdf_Property("http://www.w3.org/ns/shacl#labelTemplate") },
	get languageIn() { return new rdf_Property("http://www.w3.org/ns/shacl#languageIn") },
	get lessThan() { return new rdf_Property("http://www.w3.org/ns/shacl#lessThan") },
	get lessThanOrEquals() { return new rdf_Property("http://www.w3.org/ns/shacl#lessThanOrEquals") },
	get limit() { return new rdf_Property("http://www.w3.org/ns/shacl#limit") },
	get max() { return new rdf_Property("http://www.w3.org/ns/shacl#max") },
	get maxCount() { return new rdf_Property("http://www.w3.org/ns/shacl#maxCount") },
	get maxExclusive() { return new rdf_Property("http://www.w3.org/ns/shacl#maxExclusive") },
	get maxInclusive() { return new rdf_Property("http://www.w3.org/ns/shacl#maxInclusive") },
	get maxLength() { return new rdf_Property("http://www.w3.org/ns/shacl#maxLength") },
	get message() { return new rdf_Property("http://www.w3.org/ns/shacl#message") },
	get min() { return new rdf_Property("http://www.w3.org/ns/shacl#min") },
	get minCount() { return new rdf_Property("http://www.w3.org/ns/shacl#minCount") },
	get minExclusive() { return new rdf_Property("http://www.w3.org/ns/shacl#minExclusive") },
	get minInclusive() { return new rdf_Property("http://www.w3.org/ns/shacl#minInclusive") },
	get minLength() { return new rdf_Property("http://www.w3.org/ns/shacl#minLength") },
	get minus() { return new rdf_Property("http://www.w3.org/ns/shacl#minus") },
	get name() { return new rdf_Property("http://www.w3.org/ns/shacl#name") },
	get namespace() { return new rdf_Property("http://www.w3.org/ns/shacl#namespace") },
	get node() { return new rdf_Property("http://www.w3.org/ns/shacl#node") },
	get nodeKind() { return new rdf_Property("http://www.w3.org/ns/shacl#nodeKind") },
	get nodeValidator() { return new rdf_Property("http://www.w3.org/ns/shacl#nodeValidator") },
	get nodes() { return new rdf_Property("http://www.w3.org/ns/shacl#nodes") },
	get not() { return new rdf_Property("http://www.w3.org/ns/shacl#not") },
	get object() { return new rdf_Property("http://www.w3.org/ns/shacl#object") },
	get offset() { return new rdf_Property("http://www.w3.org/ns/shacl#offset") },
	get oneOrMorePath() { return new rdf_Property("http://www.w3.org/ns/shacl#oneOrMorePath") },
	get optional() { return new rdf_Property("http://www.w3.org/ns/shacl#optional") },
	get or() { return new rdf_Property("http://www.w3.org/ns/shacl#or") },
	get order() { return new rdf_Property("http://www.w3.org/ns/shacl#order") },
	get orderBy() { return new rdf_Property("http://www.w3.org/ns/shacl#orderBy") },
	get parameter() { return new rdf_Property("http://www.w3.org/ns/shacl#parameter") },
	get path() { return new rdf_Property("http://www.w3.org/ns/shacl#path") },
	get pattern() { return new rdf_Property("http://www.w3.org/ns/shacl#pattern") },
	get predicate() { return new rdf_Property("http://www.w3.org/ns/shacl#predicate") },
	get prefix() { return new rdf_Property("http://www.w3.org/ns/shacl#prefix") },
	get prefixes() { return new rdf_Property("http://www.w3.org/ns/shacl#prefixes") },
	get property() { return new rdf_Property("http://www.w3.org/ns/shacl#property") },
	get propertyValidator() { return new rdf_Property("http://www.w3.org/ns/shacl#propertyValidator") },
	get qualifiedMaxCount() { return new rdf_Property("http://www.w3.org/ns/shacl#qualifiedMaxCount") },
	get qualifiedMinCount() { return new rdf_Property("http://www.w3.org/ns/shacl#qualifiedMinCount") },
	get qualifiedValueShape() { return new rdf_Property("http://www.w3.org/ns/shacl#qualifiedValueShape") },
	get qualifiedValueShapesDisjoint() { return new rdf_Property("http://www.w3.org/ns/shacl#qualifiedValueShapesDisjoint") },
	get result() { return new rdf_Property("http://www.w3.org/ns/shacl#result") },
	get resultAnnotation() { return new rdf_Property("http://www.w3.org/ns/shacl#resultAnnotation") },
	get resultMessage() { return new rdf_Property("http://www.w3.org/ns/shacl#resultMessage") },
	get resultPath() { return new rdf_Property("http://www.w3.org/ns/shacl#resultPath") },
	get resultSeverity() { return new rdf_Property("http://www.w3.org/ns/shacl#resultSeverity") },
	get returnType() { return new rdf_Property("http://www.w3.org/ns/shacl#returnType") },
	get rule() { return new rdf_Property("http://www.w3.org/ns/shacl#rule") },
	get select() { return new rdf_Property("http://www.w3.org/ns/shacl#select") },
	get separator() { return new rdf_Property("http://www.w3.org/ns/shacl#separator") },
	get severity() { return new rdf_Property("http://www.w3.org/ns/shacl#severity") },
	get shapesGraph() { return new rdf_Property("http://www.w3.org/ns/shacl#shapesGraph") },
	get shapesGraphWellFormed() { return new rdf_Property("http://www.w3.org/ns/shacl#shapesGraphWellFormed") },
	get sourceConstraint() { return new rdf_Property("http://www.w3.org/ns/shacl#sourceConstraint") },
	get sourceConstraintComponent() { return new rdf_Property("http://www.w3.org/ns/shacl#sourceConstraintComponent") },
	get sourceShape() { return new rdf_Property("http://www.w3.org/ns/shacl#sourceShape") },
	get sparql() { return new rdf_Property("http://www.w3.org/ns/shacl#sparql") },
	get subject() { return new rdf_Property("http://www.w3.org/ns/shacl#subject") },
	get suggestedShapesGraph() { return new rdf_Property("http://www.w3.org/ns/shacl#suggestedShapesGraph") },
	get sum() { return new rdf_Property("http://www.w3.org/ns/shacl#sum") },
	get target() { return new rdf_Property("http://www.w3.org/ns/shacl#target") },
	get targetClass() { return new rdf_Property("http://www.w3.org/ns/shacl#targetClass") },
	get targetNode() { return new rdf_Property("http://www.w3.org/ns/shacl#targetNode") },
	get targetObjectsOf() { return new rdf_Property("http://www.w3.org/ns/shacl#targetObjectsOf") },
	get targetSubjectsOf() { return new rdf_Property("http://www.w3.org/ns/shacl#targetSubjectsOf") },
	get then() { return new rdf_Property("http://www.w3.org/ns/shacl#then") },
	get union() { return new rdf_Property("http://www.w3.org/ns/shacl#union") },
	get uniqueLang() { return new rdf_Property("http://www.w3.org/ns/shacl#uniqueLang") },
	get update() { return new rdf_Property("http://www.w3.org/ns/shacl#update") },
	get validator() { return new rdf_Property("http://www.w3.org/ns/shacl#validator") },
	get value() { return new rdf_Property("http://www.w3.org/ns/shacl#value") },
	get values() { return new rdf_Property("http://www.w3.org/ns/shacl#values") },
	get xone() { return new rdf_Property("http://www.w3.org/ns/shacl#xone") },
	get zeroOrMorePath() { return new rdf_Property("http://www.w3.org/ns/shacl#zeroOrMorePath") },
	get zeroOrOnePath() { return new rdf_Property("http://www.w3.org/ns/shacl#zeroOrOnePath") },
	get AbstractResult() { return new rdfs_Class("http://www.w3.org/ns/shacl#AbstractResult") },
	get ConstraintComponent() { return new rdfs_Class("http://www.w3.org/ns/shacl#ConstraintComponent") },
	get Function() { return new rdfs_Class("http://www.w3.org/ns/shacl#Function") },
	get NodeKind() { return new rdfs_Class("http://www.w3.org/ns/shacl#NodeKind") },
	get NodeShape() { return new rdfs_Class("http://www.w3.org/ns/shacl#NodeShape") },
	get Parameter() { return new rdfs_Class("http://www.w3.org/ns/shacl#Parameter") },
	get Parameterizable() { return new rdfs_Class("http://www.w3.org/ns/shacl#Parameterizable") },
	get PrefixDeclaration() { return new rdfs_Class("http://www.w3.org/ns/shacl#PrefixDeclaration") },
	get PropertyGroup() { return new rdfs_Class("http://www.w3.org/ns/shacl#PropertyGroup") },
	get PropertyShape() { return new rdfs_Class("http://www.w3.org/ns/shacl#PropertyShape") },
	get ResultAnnotation() { return new rdfs_Class("http://www.w3.org/ns/shacl#ResultAnnotation") },
	get Rule() { return new rdfs_Class("http://www.w3.org/ns/shacl#Rule") },
	get SPARQLAskExecutable() { return new rdfs_Class("http://www.w3.org/ns/shacl#SPARQLAskExecutable") },
	get SPARQLAskValidator() { return new rdfs_Class("http://www.w3.org/ns/shacl#SPARQLAskValidator") },
	get SPARQLConstraint() { return new rdfs_Class("http://www.w3.org/ns/shacl#SPARQLConstraint") },
	get SPARQLConstructExecutable() { return new rdfs_Class("http://www.w3.org/ns/shacl#SPARQLConstructExecutable") },
	get SPARQLExecutable() { return new rdfs_Class("http://www.w3.org/ns/shacl#SPARQLExecutable") },
	get SPARQLFunction() { return new rdfs_Class("http://www.w3.org/ns/shacl#SPARQLFunction") },
	get SPARQLRule() { return new rdfs_Class("http://www.w3.org/ns/shacl#SPARQLRule") },
	get SPARQLSelectExecutable() { return new rdfs_Class("http://www.w3.org/ns/shacl#SPARQLSelectExecutable") },
	get SPARQLSelectValidator() { return new rdfs_Class("http://www.w3.org/ns/shacl#SPARQLSelectValidator") },
	get SPARQLTarget() { return new rdfs_Class("http://www.w3.org/ns/shacl#SPARQLTarget") },
	get SPARQLTargetType() { return new rdfs_Class("http://www.w3.org/ns/shacl#SPARQLTargetType") },
	get SPARQLUpdateExecutable() { return new rdfs_Class("http://www.w3.org/ns/shacl#SPARQLUpdateExecutable") },
	get Severity() { return new rdfs_Class("http://www.w3.org/ns/shacl#Severity") },
	get Shape() { return new rdfs_Class("http://www.w3.org/ns/shacl#Shape") },
	get Target() { return new rdfs_Class("http://www.w3.org/ns/shacl#Target") },
	get TargetType() { return new rdfs_Class("http://www.w3.org/ns/shacl#TargetType") },
	get TripleRule() { return new rdfs_Class("http://www.w3.org/ns/shacl#TripleRule") },
	get ValidationReport() { return new rdfs_Class("http://www.w3.org/ns/shacl#ValidationReport") },
	get ValidationResult() { return new rdfs_Class("http://www.w3.org/ns/shacl#ValidationResult") },
	get Validator() { return new rdfs_Class("http://www.w3.org/ns/shacl#Validator") },
	
	NS: "http://www.w3.org/ns/shacl#",
	PREFIX: "sh",
}


/**
 * Generated from the namespace <http://www.w3.org/2004/02/skos/core#>
 */
const skos = {

	/**
	 * Converts a value into an instance of skos_Collection
	 * @param {?GraphNode|?string|?boolean|?number} obj - the node or URI string to convert
	 * @returns {?skos_Collection} the converted node or null if the input was not a string or object
	 */
	asCollection: (obj) => {
		return obj == null || typeof obj == 'boolean' || typeof obj == 'number' ? null : new skos_Collection(obj);
	},
	
	/**
	 * Converts an array of values into an array of instances of skos_Collection
	 * @param {(GraphNode|string|boolean|number)[]} objs - the nodes or URI strings to convert
	 * @returns {skos_Collection[]} the converted nodes
	 */
	asCollectionArray: (objs) => {
		return objs.filter(obj => typeof obj != 'boolean' && typeof obj != 'number').map(obj => new skos_Collection(obj));
	},
	
	/**
	 * Converts a value into an instance of skos_Concept
	 * @param {?GraphNode|?string|?boolean|?number} obj - the node or URI string to convert
	 * @returns {?skos_Concept} the converted node or null if the input was not a string or object
	 */
	asConcept: (obj) => {
		return obj == null || typeof obj == 'boolean' || typeof obj == 'number' ? null : new skos_Concept(obj);
	},
	
	/**
	 * Converts an array of values into an array of instances of skos_Concept
	 * @param {(GraphNode|string|boolean|number)[]} objs - the nodes or URI strings to convert
	 * @returns {skos_Concept[]} the converted nodes
	 */
	asConceptArray: (objs) => {
		return objs.filter(obj => typeof obj != 'boolean' && typeof obj != 'number').map(obj => new skos_Concept(obj));
	},
	
	/**
	 * Converts a value into an instance of skos_ConceptScheme
	 * @param {?GraphNode|?string|?boolean|?number} obj - the node or URI string to convert
	 * @returns {?skos_ConceptScheme} the converted node or null if the input was not a string or object
	 */
	asConceptScheme: (obj) => {
		return obj == null || typeof obj == 'boolean' || typeof obj == 'number' ? null : new skos_ConceptScheme(obj);
	},
	
	/**
	 * Converts an array of values into an array of instances of skos_ConceptScheme
	 * @param {(GraphNode|string|boolean|number)[]} objs - the nodes or URI strings to convert
	 * @returns {skos_ConceptScheme[]} the converted nodes
	 */
	asConceptSchemeArray: (objs) => {
		return objs.filter(obj => typeof obj != 'boolean' && typeof obj != 'number').map(obj => new skos_ConceptScheme(obj));
	},
	
	/**
	 * Converts a value into an instance of skos_OrderedCollection
	 * @param {?GraphNode|?string|?boolean|?number} obj - the node or URI string to convert
	 * @returns {?skos_OrderedCollection} the converted node or null if the input was not a string or object
	 */
	asOrderedCollection: (obj) => {
		return obj == null || typeof obj == 'boolean' || typeof obj == 'number' ? null : new skos_OrderedCollection(obj);
	},
	
	/**
	 * Converts an array of values into an array of instances of skos_OrderedCollection
	 * @param {(GraphNode|string|boolean|number)[]} objs - the nodes or URI strings to convert
	 * @returns {skos_OrderedCollection[]} the converted nodes
	 */
	asOrderedCollectionArray: (objs) => {
		return objs.filter(obj => typeof obj != 'boolean' && typeof obj != 'number').map(obj => new skos_OrderedCollection(obj));
	},
	
	/**
	 * Creates a new instance of skos_Collection based on initial property values.
	 * @param {skos_Collection_Props} props - name-value pairs for the initial properties
	 * @returns {skos_Collection}
	 */
	createCollection: (props) => {
		return RDFNodeUtil.createInstance(skos_Collection, 'http://www.w3.org/2004/02/skos/core#Collection', props);
	},
	
	/**
	 * Creates a new instance of skos_Concept based on initial property values.
	 * @param {skos_Concept_Props} props - name-value pairs for the initial properties
	 * @returns {skos_Concept}
	 */
	createConcept: (props) => {
		return RDFNodeUtil.createInstance(skos_Concept, 'http://www.w3.org/2004/02/skos/core#Concept', props);
	},
	
	/**
	 * Creates a new instance of skos_ConceptScheme based on initial property values.
	 * @param {skos_ConceptScheme_Props} props - name-value pairs for the initial properties
	 * @returns {skos_ConceptScheme}
	 */
	createConceptScheme: (props) => {
		return RDFNodeUtil.createInstance(skos_ConceptScheme, 'http://www.w3.org/2004/02/skos/core#ConceptScheme', props);
	},
	
	/**
	 * Creates a new instance of skos_OrderedCollection based on initial property values.
	 * @param {skos_OrderedCollection_Props} props - name-value pairs for the initial properties
	 * @returns {skos_OrderedCollection}
	 */
	createOrderedCollection: (props) => {
		return RDFNodeUtil.createInstance(skos_OrderedCollection, 'http://www.w3.org/2004/02/skos/core#OrderedCollection', props);
	},
	
	/**
	 * Gets all instances of the class skos:Collection in the data graph.
	 * @returns {skos_Collection[]} all instances including those of subclasses
	 */
	everyCollection: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/2004/02/skos/core#Collection"), skos_Collection);
	},
	
	/**
	 * Gets all instances of the class skos:Concept in the data graph.
	 * @returns {skos_Concept[]} all instances including those of subclasses
	 */
	everyConcept: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/2004/02/skos/core#Concept"), skos_Concept);
	},
	
	/**
	 * Gets all instances of the class skos:ConceptScheme in the data graph.
	 * @returns {skos_ConceptScheme[]} all instances including those of subclasses
	 */
	everyConceptScheme: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/2004/02/skos/core#ConceptScheme"), skos_ConceptScheme);
	},
	
	/**
	 * Gets all instances of the class skos:OrderedCollection in the data graph.
	 * @returns {skos_OrderedCollection[]} all instances including those of subclasses
	 */
	everyOrderedCollection: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/2004/02/skos/core#OrderedCollection"), skos_OrderedCollection);
	},
	
	get altLabel() { return new rdf_Property("http://www.w3.org/2004/02/skos/core#altLabel") },
	get broadMatch() { return new rdf_Property("http://www.w3.org/2004/02/skos/core#broadMatch") },
	get broader() { return new rdf_Property("http://www.w3.org/2004/02/skos/core#broader") },
	get broaderTransitive() { return new rdf_Property("http://www.w3.org/2004/02/skos/core#broaderTransitive") },
	get changeNote() { return new rdf_Property("http://www.w3.org/2004/02/skos/core#changeNote") },
	get closeMatch() { return new rdf_Property("http://www.w3.org/2004/02/skos/core#closeMatch") },
	get definition() { return new rdf_Property("http://www.w3.org/2004/02/skos/core#definition") },
	get editorialNote() { return new rdf_Property("http://www.w3.org/2004/02/skos/core#editorialNote") },
	get exactMatch() { return new rdf_Property("http://www.w3.org/2004/02/skos/core#exactMatch") },
	get example() { return new rdf_Property("http://www.w3.org/2004/02/skos/core#example") },
	get hasTopConcept() { return new rdf_Property("http://www.w3.org/2004/02/skos/core#hasTopConcept") },
	get hiddenLabel() { return new rdf_Property("http://www.w3.org/2004/02/skos/core#hiddenLabel") },
	get historyNote() { return new rdf_Property("http://www.w3.org/2004/02/skos/core#historyNote") },
	get inScheme() { return new rdf_Property("http://www.w3.org/2004/02/skos/core#inScheme") },
	get mappingRelation() { return new rdf_Property("http://www.w3.org/2004/02/skos/core#mappingRelation") },
	get member() { return new rdf_Property("http://www.w3.org/2004/02/skos/core#member") },
	get memberList() { return new rdf_Property("http://www.w3.org/2004/02/skos/core#memberList") },
	get narrowMatch() { return new rdf_Property("http://www.w3.org/2004/02/skos/core#narrowMatch") },
	get narrower() { return new rdf_Property("http://www.w3.org/2004/02/skos/core#narrower") },
	get narrowerTransitive() { return new rdf_Property("http://www.w3.org/2004/02/skos/core#narrowerTransitive") },
	get notation() { return new rdf_Property("http://www.w3.org/2004/02/skos/core#notation") },
	get note() { return new rdf_Property("http://www.w3.org/2004/02/skos/core#note") },
	get prefLabel() { return new rdf_Property("http://www.w3.org/2004/02/skos/core#prefLabel") },
	get related() { return new rdf_Property("http://www.w3.org/2004/02/skos/core#related") },
	get relatedMatch() { return new rdf_Property("http://www.w3.org/2004/02/skos/core#relatedMatch") },
	get scopeNote() { return new rdf_Property("http://www.w3.org/2004/02/skos/core#scopeNote") },
	get semanticRelation() { return new rdf_Property("http://www.w3.org/2004/02/skos/core#semanticRelation") },
	get topConceptOf() { return new rdf_Property("http://www.w3.org/2004/02/skos/core#topConceptOf") },
	get Collection() { return new rdfs_Class("http://www.w3.org/2004/02/skos/core#Collection") },
	get Concept() { return new rdfs_Class("http://www.w3.org/2004/02/skos/core#Concept") },
	get ConceptScheme() { return new rdfs_Class("http://www.w3.org/2004/02/skos/core#ConceptScheme") },
	get OrderedCollection() { return new rdfs_Class("http://www.w3.org/2004/02/skos/core#OrderedCollection") },
	
	NS: "http://www.w3.org/2004/02/skos/core#",
	PREFIX: "skos",
}


/**
 * Generated from the namespace <http://www.w3.org/2008/05/skos-xl#>
 */
const skosxl = {

	/**
	 * Converts a value into an instance of skosxl_Label
	 * @param {?GraphNode|?string|?boolean|?number} obj - the node or URI string to convert
	 * @returns {?skosxl_Label} the converted node or null if the input was not a string or object
	 */
	asLabel: (obj) => {
		return obj == null || typeof obj == 'boolean' || typeof obj == 'number' ? null : new skosxl_Label(obj);
	},
	
	/**
	 * Converts an array of values into an array of instances of skosxl_Label
	 * @param {(GraphNode|string|boolean|number)[]} objs - the nodes or URI strings to convert
	 * @returns {skosxl_Label[]} the converted nodes
	 */
	asLabelArray: (objs) => {
		return objs.filter(obj => typeof obj != 'boolean' && typeof obj != 'number').map(obj => new skosxl_Label(obj));
	},
	
	/**
	 * Creates a new instance of skosxl_Label based on initial property values.
	 * @param {skosxl_Label_Props} props - name-value pairs for the initial properties
	 * @returns {skosxl_Label}
	 */
	createLabel: (props) => {
		return RDFNodeUtil.createInstance(skosxl_Label, 'http://www.w3.org/2008/05/skos-xl#Label', props);
	},
	
	/**
	 * Gets all instances of the class skosxl:Label in the data graph.
	 * @returns {skosxl_Label[]} all instances including those of subclasses
	 */
	everyLabel: () => {
		return RDFNodeUtil.castValues(__jenaData.every("http://www.w3.org/2008/05/skos-xl#Label"), skosxl_Label);
	},
	
	get altLabel() { return new rdf_Property("http://www.w3.org/2008/05/skos-xl#altLabel") },
	get hiddenLabel() { return new rdf_Property("http://www.w3.org/2008/05/skos-xl#hiddenLabel") },
	get icon() { return new rdf_Property("http://www.w3.org/2008/05/skos-xl#icon") },
	get labelRelation() { return new rdf_Property("http://www.w3.org/2008/05/skos-xl#labelRelation") },
	get literalForm() { return new rdf_Property("http://www.w3.org/2008/05/skos-xl#literalForm") },
	get prefLabel() { return new rdf_Property("http://www.w3.org/2008/05/skos-xl#prefLabel") },
	get Label() { return new rdfs_Class("http://www.w3.org/2008/05/skos-xl#Label") },
	
	NS: "http://www.w3.org/2008/05/skos-xl#",
	PREFIX: "skosxl",
}


/**
 * Generated from the namespace <http://topbraid.org/sparqlmotionfunctions#>
 */
const smf = {

	/**
	 * Takes the string of a phone number from a variety of formats, and an optional two-letter uppercase country code, and produces a "normalized" string using international conventions. Returns nothing if the phone number cannot be handled (use smf:isPhoneNumber beforehand).
	 * @param {string} arg1  The string to check.
	 * @param {string?} arg2  The default country code, as an upper-case two letter abbreviation.
	 * @returns {string}
	 */
	asInternationalPhoneNumber(arg1, arg2) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/sparqlmotionfunctions#asInternationalPhoneNumber", arg1, arg2), null);
	},
	
	/**
	 * Returns the base URI (resource) of a given file (?arg1), where the file is specified as a path string relative to the workspace root. This function might be used in conjunction with tops:files.
	 * @param {string} arg1  The path string, e.g. "/MyProject/MyFolder/MyFile.rdf".
	 * @returns {NamedNode}
	 */
	baseURI(arg1) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/sparqlmotionfunctions#baseURI", arg1), NamedNode);
	},
	
	/**
	 * Checks if a given graph can be read (by the current user).
	 * @param {NamedNode} arg1  Graph base URI
	 * @returns {boolean}
	 */
	canRead(arg1) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/sparqlmotionfunctions#canRead", arg1), null);
	},
	
	/**
	 * Checks if a given graph can be modified (by the current user).
	 * @param {NamedNode} arg1  Graph base URI
	 * @returns {boolean}
	 */
	canWrite(arg1) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/sparqlmotionfunctions#canWrite", arg1), null);
	},
	
	/**
	 * Checks if current user belongs to a named role.
	 * @param {string} roleName  The name of the role to check.
	 * @returns {boolean}
	 */
	checkCurrentUserRole(roleName) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/sparqlmotionfunctions#checkCurrentUserRole", roleName), null);
	},
	
	/**
	 * Gets a named attribute of the user that is currently logged into TopBraid. The attribute name must be present in the selected user management system (e.g. LDAP), and typical values include "company" and "mail".
	 * @param {string} attributeName  The name of the attribute to get (e.g. "company").
	 * @returns {string}
	 */
	currentUserAttribute(attributeName) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/sparqlmotionfunctions#currentUserAttribute", attributeName), null);
	},
	
	/**
	 * Gets the name of the user that is currently logged into TopBraid.
	 * @returns {string}
	 */
	currentUserName() {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/sparqlmotionfunctions#currentUserName"), null);
	},
	
	/**
	 * Encodes a string so that it can be inserted into XML documents. Special characters will be converted.
	 * @param {string} arg1  The string to escape.
	 * @returns {string}
	 */
	escapeXML(arg1) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/sparqlmotionfunctions#escapeXML", arg1), null);
	},
	
	/**
	 * Gets the path to the workspace file holding a given base URI (?arg1). If the second argument is true then the path will be relative to the workspace root. Otherwise it will be absolute.
	 * @param arg1  The base URI - either as string or a URI resource.
	 * @param {boolean?} arg2  True to return a relative path.
	 * @returns {string}
	 */
	file(arg1, arg2) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/sparqlmotionfunctions#file", arg1, arg2), null);
	},
	
	/**
	 * Returns the last-modified time stamp of a file that represents a given graph in the workspace. The result is an xsd:integer of the milliseconds since the epoch.
	 * @param {NamedNode} arg1  The base URI of the graph represented by the file of which to get the time stamp.
	 * @returns {number}
	 */
	fileLastModified(arg1) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/sparqlmotionfunctions#fileLastModified", arg1), null);
	},
	
	/**
	 * Checks if a given file (?arg1) is known to have a base URI in the current workspace, where the file is specified as a path string relative to the workspace root. This function might be used in conjunction with tops:files.
	 * @param {string} arg1  The path string, e.g. "/MyProject/MyFolder/MyFile.rdf".
	 * @returns {boolean}
	 */
	hasBaseURI(arg1) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/sparqlmotionfunctions#hasBaseURI", arg1), null);
	},
	
	/**
	 * Checks if there is a user that is currently logged into TopBraid.
	 * @returns {boolean}
	 */
	hasCurrentUser() {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/sparqlmotionfunctions#hasCurrentUser"), null);
	},
	
	/**
	 * Checks if there is any workspace file holding a given base URI (?arg1).
	 * @param arg1  The base URI - either as string or a URI resource.
	 * @returns {boolean}
	 */
	hasFile(arg1) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/sparqlmotionfunctions#hasFile", arg1), null);
	},
	
	/**
	 * Checks whether a given string is a domain name as specified by RFC1034/RFC1123 and according to the IANA-recognized list of top-level domains (TLDs). Returns nothing if the provided argument is not a literal.
	 * @param {string} string  The string to validate.
	 * @returns {boolean}
	 */
	isDomainName(string) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/sparqlmotionfunctions#isDomainName", string), null);
	},
	
	/**
	 * Checks whether a given string is a valid Email address according to RFC 822 standards. Returns unbound if the given argument is not a literal.
	 * @param {string} string  The string to validate.
	 * @returns {boolean}
	 */
	isEmailAddress(string) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/sparqlmotionfunctions#isEmailAddress", string), null);
	},
	
	/**
	 * Checks whether a given string is a valid phone number, possibly in the context of a given default country code.
	 * @param {string} arg1  The string to check.
	 * @param {string?} arg2  The default country code, as an upper-case two letter abbreviation.
	 * @returns {boolean}
	 */
	isPhoneNumber(arg1, arg2) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/sparqlmotionfunctions#isPhoneNumber", arg1, arg2), null);
	},
	
	/**
	 * Checks if a given graph URI is backed by a file in a system project (such as TopBraid or teamwork.topbraidlive.org).
	 * @param {NamedNode} arg1  The graph URI.
	 * @returns {boolean}
	 */
	isSystemGraph(arg1) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/sparqlmotionfunctions#isSystemGraph", arg1), null);
	},
	
	/**
	 * Checks whether a given string is a well-formed URL by checking the scheme, authority, path, query, and fragment in turn.
	 * @param {string} string  The string to check.
	 * @returns {boolean}
	 */
	isURL(string) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/sparqlmotionfunctions#isURL", string), null);
	},
	
	/**
	 * Checks whether a given node represents a TopBraid user account (as produced by smf:userWithName).
	 * @param node  The node to check.
	 * @returns {boolean}
	 */
	isUserAccount(node) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/sparqlmotionfunctions#isUserAccount", node), null);
	},
	
	/**
	 * Computes the Levenshtein Distance between two strings.
	 * @param {string} arg1  The first string.
	 * @param {string} arg2  The second string.
	 * @returns {number}
	 */
	levenshteinDistance(arg1, arg2) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/sparqlmotionfunctions#levenshteinDistance", arg1, arg2), null);
	},
	
	/**
	 * Takes a resource (usually a blank node) as argument and finds a URI resource that is the root of a blank node tree that contains the blank node. For example, if there is a blank node inside of a SPIN RDF structure that is linked to a class via spin:rule, then this function will return the class that points to the root of the SPIN RDF structure. Another example is OWL expressions such as owl:Restrictions.
	 * @param {NamedNode} arg1  The resource to find the reference to.
	 * @returns {NamedNode}
	 */
	rootURISubject(arg1) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/sparqlmotionfunctions#rootURISubject", arg1), NamedNode);
	},
	
	/**
	 * Returns the IRI of the subgraph that a given triple (subject, predicate, object) has been defined in. This is supported for graphs that are known to TopBraid's graph registry only, including union graphs such as those created with ui:graphWithImports.
	 * @param {NamedNode} arg1  The subject of the triple.
	 * @param {rdf_Property} arg2  The predicate of the triple.
	 * @param arg3  The object of the triple.
	 * @returns {NamedNode}
	 */
	tripleDefinedIn(arg1, arg2, arg3) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/sparqlmotionfunctions#tripleDefinedIn", arg1, arg2, arg3), NamedNode);
	},
	
	/**
	 * Returns a Turtle (source code) representation of a given RDF node, using the prefixes from the current query graph. For blank nodes this includes depending triples, for URIs and literals just the single value rendering.
	 * @param resource  The RDF node to render into Turtle.
	 * @returns {string}
	 */
	turtleString(resource) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/sparqlmotionfunctions#turtleString", resource), null);
	},
	
	/**
	 * Gets the display name of a user with a given URI (of the form urn:x-tb-users:XY). Note that the result of this can not necessarily be used as input to smf:userwithName, because the display name may be different from the internal user name.
	 * @param {NamedNode} user  The URI node of the user.
	 * @returns {string}
	 */
	userDisplayName(user) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/sparqlmotionfunctions#userDisplayName", user), null);
	},
	
	/**
	 * Gets the email address associated with a user with a given URI (of the form urn:x-tb-users:XY). This could be retrieved from the LDAP directory, or from any property with local name "email" in the users.ttl file, or from the property edg:email in the active query graph.
	 * @param {NamedNode} user  The URI node of the user.
	 * @returns {string}
	 */
	userEmail(user) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/sparqlmotionfunctions#userEmail", user), null);
	},
	
	/**
	 * Converts a user URI resource into a user name. Returns nothing if the given node is not a URI that follows the URI naming pattern used by TopBraid. The inverse function is smf:userWithName.
	 * @param {NamedNode} arg1  The user resource to convert to a name.
	 * @returns {NamedNode}
	 */
	userName(arg1) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/sparqlmotionfunctions#userName", arg1), NamedNode);
	},
	
	/**
	 * Converts a user name into a URI resource, following the default settings in TopBraid. Often used in conjunction with smf:currentUserName(). The inverse function is smf:userName.
	 * @param {string} arg1  The user name to convert to a resource.
	 * @returns {NamedNode}
	 */
	userWithName(arg1) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/sparqlmotionfunctions#userWithName", arg1), NamedNode);
	},
	
	
	NS: "http://topbraid.org/sparqlmotionfunctions#",
	PREFIX: "smf",
}


/**
 * Generated from the namespace <http://spinrdf.org/spif#>
 */
const spif = {

	/**
	 * Converts an input string into camel case.
	 * For example, "semantic web" becomes "SemanticWeb".
	 * An optional matching expression can be given to only convert the matched characters.
	 * @param {string} arg1  the input string
	 * @param {string?} arg2  The match expression
	 * @returns {string}
	 */
	camelCase(arg1, arg2) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://spinrdf.org/spif#camelCase", arg1, arg2), null);
	},
	
	/**
	 * Takes a number as its first argument and applies a given formatting string to it, for example, to convert a floating point into a number that has exactly two decimal places after the dot. For example, spif:decimalFormat(12.3456, "#.##") returns "12.35". The resulting string can then by cast back to a number, e.g. using xsd:double(?str).
	 * @param {number} number  The number to format.
	 * @param {string} pattern  The pattern, following the syntax defined for the Java DecimalFormat class (see: http://download.oracle.com/javase/6/docs/api/java/text/DecimalFormat.html).
	 * @returns {string}
	 */
	decimalFormat(number, pattern) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://spinrdf.org/spif#decimalFormat", number, pattern), null);
	},
	
	/**
	 * Decodes a URL string - this is the inverse operation of spif:encodeURL.
	 * @param {string} arg1  The URL to decode.
	 * @param {string?} arg2  The (optional) encoding. Defaults to UTF-8.
	 * @returns {string}
	 */
	decodeURL(arg1, arg2) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://spinrdf.org/spif#decodeURL", arg1, arg2), null);
	},
	
	/**
	 * Encodes a URL string, for example so that it can be passed as an argument to REST services.
	 * @param {string} arg1  The URL to encode.
	 * @param {string?} arg2  The (optional) encoding. Defaults to UTF-8.
	 * @returns {string}
	 */
	encodeURL(arg1, arg2) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://spinrdf.org/spif#encodeURL", arg1, arg2), null);
	},
	
	/**
	 * Constructs a human-readable label for a URI resource by taking everything after the last '/' or the last '#' as starting point.
	 * @param {NamedNode} arg1  The resource to generate a label for.
	 * @returns {string}
	 */
	generateLabel(arg1) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://spinrdf.org/spif#generateLabel", arg1), null);
	},
	
	/**
	 * Gets the index of the first occurrence of a certain substring in a given search string. Returns an error if the substring is not found.
	 * @param {string} arg1  the string to search in
	 * @param {string} arg2  the sub string to search for
	 * @param {number?} arg3  The optional index to start with.
	 * @returns {number}
	 */
	indexOf(arg1, arg2, arg3) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://spinrdf.org/spif#indexOf", arg1, arg2, arg3), null);
	},
	
	/**
	 * Gets the index of the last occurrence of a certain substring in a given search string. Returns an error if the substring is not found.
	 * @param {string} arg1  the string to search in
	 * @param {string} arg2  the sub string to search for
	 * @param {number?} arg3  The optional index to start with.
	 * @returns {number}
	 */
	lastIndexOf(arg1, arg2, arg3) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://spinrdf.org/spif#lastIndexOf", arg1, arg2, arg3), null);
	},
	
	/**
	 * Converts an input string into lower camel case.
	 * For example, "semantic web" becomes "semanticWeb".
	 * An optional matching expression can be given to only convert the matched characters.
	 * @param {string} arg1  the input string
	 * @param {string?} arg2  The match expression
	 * @returns {string}
	 */
	lowerCamelCase(arg1, arg2) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://spinrdf.org/spif#lowerCamelCase", arg1, arg2), null);
	},
	
	/**
	 * Converts an input string into lower case.
	 * For example, "SEMANTIC Web" becomes "semantic web".
	 * An optional matching expression can be given to only convert the matched characters.
	 * @param {string} arg1  the input string
	 * @param {string?} arg2  The match expression
	 * @returns {string}
	 */
	lowerCase(arg1, arg2) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://spinrdf.org/spif#lowerCase", arg1, arg2), null);
	},
	
	/**
	 * Converts an input string into lower title case.
	 * For example, "semantic web" becomes "semantic Web".
	 * An optional matching expression can be given to only convert the matched characters.
	 * @param {string} arg1  the input string
	 * @param {string?} arg2  The match expression
	 * @returns {string}
	 */
	lowerTitleCase(arg1, arg2) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://spinrdf.org/spif#lowerTitleCase", arg1, arg2), null);
	},
	
	/**
	 * An input string is converted into a result string by applying a match and replacement expressions.
	 * For example, the input string "semantic web" with the match expression "([A-z]+) ([A-z]+)" and the replacement expression "The $1 life" returns the string "The semantic life".
	 * An optional input string is returned, if no match occurs. If this string is empty and no match occurs, then the result string is unbound.
	 * @param {string} arg1  the input string
	 * @param {string} arg2  The match expression
	 * @param {string} arg3  The replacement expression
	 * @param {string?} arg4  The optional string returned as result string if no match occurs. If this string is empty and no match occurs, then the result string is unbound.
	 * @returns {string}
	 */
	regex(arg1, arg2, arg3, arg4) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://spinrdf.org/spif#regex", arg1, arg2, arg3, arg4), null);
	},
	
	/**
	 * Does a string replacement based on the Java function String.replaceAll().
	 * @param {string} arg1  The string to operate on.
	 * @param {string} arg2  The regular expression to search for.
	 * @param {string} arg3  The replacement string.
	 * @returns {string}
	 */
	replaceAll(arg1, arg2, arg3) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://spinrdf.org/spif#replaceAll", arg1, arg2, arg3), null);
	},
	
	/**
	 * Converts an input string to title case.
	 * For example, "germany" becomes "Germany".
	 * An optional matching expression can be given to only convert the matched characters.
	 * @param {string} arg1  The input string
	 * @param {string?} arg2  The match expression
	 * @returns {string}
	 */
	titleCase(arg1, arg2) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://spinrdf.org/spif#titleCase", arg1, arg2), null);
	},
	
	/**
	 * Produces a valid Java identifier based on a given input string, dropping any characters that would not be valid Java identifiers. Produces the empty string if no character can be reused from the given string. Note that this function is even stricter than the normal Java identifier algorithm, as it only allows ASCII characters or digits.
	 * @param {string} arg1  The input string.
	 * @returns {string}
	 */
	toJavaIdentifier(arg1) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://spinrdf.org/spif#toJavaIdentifier", arg1), null);
	},
	
	/**
	 * Creates a new string value by trimming an input string. Leading and trailing whitespaces are deleted.
	 * @param {string} arg1  the text to trim
	 * @returns {string}
	 */
	trim(arg1) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://spinrdf.org/spif#trim", arg1), null);
	},
	
	/**
	 * Converts an input string into a reverse camel case.
	 * @param {string} arg1  the input string
	 * @returns {string}
	 */
	unCamelCase(arg1) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://spinrdf.org/spif#unCamelCase", arg1), null);
	},
	
	/**
	 * Converts an input string into upper case.
	 * For example, "semantic web" becomes "SEMANTIC WEB".
	 * An optional matching expression can be given to only convert the matched characters.
	 * @param {string} arg1  The input string
	 * @param {string?} arg2  The match expression
	 * @returns {string}
	 */
	upperCase(arg1, arg2) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://spinrdf.org/spif#upperCase", arg1, arg2), null);
	},
	
	
	NS: "http://spinrdf.org/spif#",
	PREFIX: "spif",
}


/**
 * Generated from the namespace <http://topbraid.org/tbs#>
 */
const tbs = {

	/**
	 * Gets the display name of the current asset collection.
	 * @returns {string}
	 */
	assetCollectionName() {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/tbs#assetCollectionName"), null);
	},
	
	/**
	 * Returns the display name of an asset collection identified by its ID.
	 * @param {string} id  The id of the asset collection to get the name of.
	 * @returns {string}
	 */
	assetCollectionNameOf(id) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/tbs#assetCollectionNameOf", id), null);
	},
	
	/**
	 * Returns the label of the type of the current asset collection. Example results are 'Ontology' or 'Taxonomy'.
	 * @returns {string}
	 */
	assetCollectionType() {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/tbs#assetCollectionType"), null);
	},
	
	/**
	 * Looks up the asset collection resource (URI) with a given singular display label, such as 'Taxonomy'.
	 * WARNING: This function is marked experimental, so use at your own risk.
	 * @param {string} label  The singular label. Note that this is case-sensitive.
	 * @returns {NamedNode}
	 */
	assetCollectionTypeWithLabel(label) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/tbs#assetCollectionTypeWithLabel", label), NamedNode);
	},
	
	/**
	 * Returns the URI resource representing an asset collection identified by its ID. For example, with the ID 'geo' this will return the resource with uri 'urn:x-evn-master:geo'.
	 * @param {string} id  The id of the asset collection to get.
	 * @returns {NamedNode}
	 */
	assetCollectionURI(id) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/tbs#assetCollectionURI", id), NamedNode);
	},
	
	/**
	 * Gets one of the configuration values set by the administrator.
	 * @param {string} name  The name of the configuration, which corresponds to the local name of a property from the cfg namespace such as "enableSPARQLUpdates"
	 */
	configValue(name) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/tbs#configValue", name), null);
	},
	
	/**
	 * Returns the id of the current asset collection, if this can be determined from the currently active context graph.
	 * @returns {string}
	 */
	currentAssetCollectionId() {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/tbs#currentAssetCollectionId"), null);
	},
	
	/**
	 * Checks whether the current user has a given permission against the current asset collection or a given workflow.
	 * @param {string} permission  Either 'viewer', 'editor' or 'manager'.
	 * @param {string?} workflowId  The workflow id to check permissions against that workflow, or nothing to check against the asset collection.
	 * @returns {boolean}
	 */
	currentUserHasPermission(permission, workflowId) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/tbs#currentUserHasPermission", permission, workflowId), null);
	},
	
	/**
	 * Returns the id of the currently logged in user. An example is 'Administrator'.
	 * @returns {string}
	 */
	currentUserId() {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/tbs#currentUserId"), null);
	},
	
	/**
	 * Checks if the current user is a TopBraid administrator.
	 * @returns {boolean}
	 */
	currentUserIsAdmin() {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/tbs#currentUserIsAdmin"), null);
	},
	
	/**
	 * When called in the context of a workflow this returns the ID of that workflow.
	 * @returns {string}
	 */
	currentWorkflowId() {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/tbs#currentWorkflowId"), null);
	},
	
	/**
	 * Gets the default namespace of the current query graph as configured for the current asset collection.
	 * @returns {string}
	 */
	defaultNamespace() {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/tbs#defaultNamespace"), null);
	},
	
	/**
	 * transitively checks permissions for the passed in graph uri for for all users who have access to the current graph
	 * This function can not be called when the active graph is a working copy of an asset collection.
	 * WARNING: This function is marked experimental, so use at your own risk.
	 * @param {string?} newimport  The new external graph URI or null to remove the current value.
	 */
	determineIncludePermissionIssues(newimport) {
		const determineIssues = (value) => {
			const mergeRoles = (securityRoles, govRoles) => {
				govRoles.forEach(role => {
					if (!securityRoles.includes(role)) {
						securityRoles.push(role);
					}
				})
				return securityRoles;
			}
		
			let graphMap = [{ graph: value.toString(), graphLabel: (value) }];
		
		
			const getTransitiveImports = (g, reached) => {
		
				graph.withDataGraph(g, () => {
					let result = graph.select(`SELECT ?importedGraph ?importedGraphLabel ?currentGraphLabel 
		      WHERE { 
		        ?s <${owl.imports.uri}> ?importedGraph .
					  BIND(ui:label(?s) AS ?currentGraphLabel) .
					  BIND(teamwork:projectLabel(?importedGraph) as ?importedGraphLabel) .
		      }`);
		
					result.bindings.forEach(row => {
						let importedGraph = row.importedGraph.uri;
		
						if (row.importedGraphLabel == null) {
							console.warn(`${importedGraph} is not resolvable and will be ignored.`);
						}
						else {
							if (!reached.includes(importedGraph)) {
								reached.push(importedGraph);
								graphMap.push({ graph: importedGraph, graphLabel: row.importedGraph, includedVia: { uri: g, label: row.currentGraphLabel } })
								reached = getTransitiveImports(importedGraph, reached)
								return reached;
							}
						}
					})
				});
		
				return reached;
			}
		
			const pullUsersAndRolesWhoHavePermission = (regularPermissions) => {
				let numberOfRoles = regularPermissions.data
				let usersAndRolesToCheck = new Map();
		
				for (let i = 0; i < numberOfRoles.length; i++) {
					let roleArray = numberOfRoles[i].data;
					let roleLabel = numberOfRoles[i].roleLabel;
					let roleURI = numberOfRoles[i].roleURI;
		
					roleArray.map(row => {
		
						let userRolePair = { user: { uri: row.value, label: row.label }, role: { uri: roleURI, label: roleLabel } };
		
						let key = JSON.stringify(userRolePair);
		
						if (!usersAndRolesToCheck.has(key)) {
							usersAndRolesToCheck.set(key, userRolePair);
		
						};
					})
				}
		
				return Array.from(usersAndRolesToCheck.values());
		
		
			}
		
			const callGetSecurityRoles = (tg) => {
				return graph.withDataGraph(tg, () => {
					return JSON.parse(graph.swp('http://topbraid.org/teamworkgovernance.ui#GetPermissions', {}));
				});
			}
		
		
			const callGetGovernanceRoles = (mg) => {
				return graph.withDataGraph(mg, () => {
					return JSON.parse(graph.swp('http://topbraid.org/teamworkgovernance.ui#GetGovernanceRoles', {}));
				})
		
			}
		
			const getCurrentGraphUserPermissions = (g) => {
				let regularPermissions = callGetSecurityRoles(g + '.tch');
				let governancePermissions = callGetGovernanceRoles(g);
		
				let securityRolesToCheck = pullUsersAndRolesWhoHavePermission(regularPermissions);
				let govRolesToCheck = pullUsersAndRolesWhoHavePermission(governancePermissions);
		
				let allRolesToCheck = mergeRoles(securityRolesToCheck, govRolesToCheck);
		
				return allRolesToCheck;
			}
		
			const getCurrentAdminAndPowerUserArray = () => {
				let ADMIN_GRP = "AdministratorGroup"
				let POWER_USER_GRP = "PowerUserGroup"
		
				let adminAndPowerUsers = graph.select(`
		        PREFIX smf: <http://topbraid.org/sparqlmotionfunctions#>
		        SELECT DISTINCT ?users  WHERE {
		            {
		            "${ADMIN_GRP}" smf:groupHasUser ?users
		            }
		            UNION
		            {
		                "${POWER_USER_GRP}" smf:groupHasUser ?users
		            }
		         }`);
		
				let usersArray = [];
		
		
				adminAndPowerUsers.bindings.forEach(row => {
					if (!usersArray.includes(row.users.uri)) {
						usersArray.push(row.users.uri);
					}
				})
				return usersArray;
			}
		
		
			const calculateRequiredUpdates = (usersWithPermissionOnCurrentGraph) => {
				let graphsMissingUserPermission = [];
		
				let currentAdminAndPowerUsers = getCurrentAdminAndPowerUserArray();
		
		
				usersWithPermissionOnCurrentGraph.forEach(user => {
					let userKey = JSON.stringify(user);
					graphMap.forEach(g => {
						let importedGraph = g.graph;
						let importedGovRoles = callGetGovernanceRoles(importedGraph)
		
		
						if (teamwork.hasTeamGraph(graph.namedNode(importedGraph))) {
							let secRoles = callGetSecurityRoles(importedGraph + '.tch');
							let securityRolesToCheck = pullUsersAndRolesWhoHavePermission(secRoles);
							let govRolesToCheck = pullUsersAndRolesWhoHavePermission(importedGovRoles);
		
							let allRolesToCheck = mergeRoles(securityRolesToCheck, govRolesToCheck);
		
							let somePermission = allRolesToCheck.some((r) => {
								let rKey = JSON.stringify(r);
								return userKey == rKey;
							});
		
		
							if (!somePermission) {
								let mapResult = graphMap.filter((row => {
									return row.graph === importedGraph;
								}));
		
		
								if (!currentAdminAndPowerUsers.includes(user.user.uri)) {
		
									let importGraphLabel = g.graphLabel.toString()
									try {
										importGraphLabel = teamwork.projectLabel(graph.namedNode(importedGraph));
										if(importGraphLabel == null){
											importGraphLabel = g.graphLabel.toString();
										}
									}
									catch (e) {
										console.log('Failed to fetch project label');
									}
		
									graphsMissingUserPermission.push({ user: user.user, roleOnCurrentGraph: user.role, graphMissingPermission: { uri: importedGraph, label: importGraphLabel, includedVia: mapResult[0].includedVia || '' } })
		
								}
							}
						}
					})
				})
				return graphsMissingUserPermission;
			}
		
			let currentGraph = value.toString();
			let usersWithPermissionOnCurrentGraph = getCurrentGraphUserPermissions(teamwork.currentMasterGraph().uri);
		
		
			getTransitiveImports(currentGraph, [currentGraph]);
		
			let graphsMissingUserPermission = calculateRequiredUpdates(usersWithPermissionOnCurrentGraph);
		
			return graphsMissingUserPermission
		};
		
		let proposedImport = newimport.toString();
		
		return determineIssues(proposedImport);
	},
	
	/**
	 * Gets the external graph URI that has been set for the current asset collection.
	 * @returns {string}
	 */
	externalGraphURI() {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/tbs#externalGraphURI"), null);
	},
	
	/**
	 * True if this has an rdf:type triple either in the base graph or any editable graph from the imports closure. This function makes most sense for workflows that can edit multiple asset collections.
	 * WARNING: This function is marked experimental, so use at your own risk.
	 * @param asset  The asset/resource to check the editable status for.
	 * @returns {boolean}
	 */
	isEditableAsset(asset) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/tbs#isEditableAsset", asset), null);
	},
	
	/**
	 * Checks if a given resource counts as a 'remote' resource in the context of the current query graph. Remote resources are assumed to be stored outside of TopBraid's local database yet can be brought into TopBraid for querying when needed.
	 * WARNING: This function is marked experimental, so use at your own risk.
	 * @param resource  The node to check.
	 * @returns {boolean}
	 */
	isRemoteResource(resource) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/tbs#isRemoteResource", resource), null);
	},
	
	/**
	 * Gets a suitable display label of a given resource. This uses skos:prefLabel (and its sub-properties) and then rdfs:label (and its sub-properties) and looks for strings with the most suitable language for the current request context.
	 * @param asset  The asset/resource to get the label for.
	 * @returns {string}
	 */
	label(asset) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/tbs#label", asset), null);
	},
	
	/**
	 * Gets a suitable display label for a given property at a given asset/resource. This uses sh:name where possible, then the globally declared (rdfs:) label and looks for strings with the most suitable language for the current request context.
	 * WARNING: This function is marked experimental, so use at your own risk.
	 * @param property  The property to get the label of.
	 * @param resource  The asset/resource to get the label at. The rdf:type of the asset will inform at which property shapes to look.
	 * @returns {string}
	 */
	propertyLabelAtAsset(property, resource) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/tbs#propertyLabelAtAsset", property, resource), null);
	},
	
	/**
	 * Gets the graph representing an asset collection or a workflow for the current user, with the included sub-graphs. This is the graph that should be used to make updates that shall be recorded as part of the change history, while the tbs:assetCollectionURI function returns the lower-level master graph itself, without going through the change history and without the included sub-graphs.
	 * @param {string?} workflowId  The ID of the workflow if a workflow graph shall be returned. If left unspecified, the graph will wrap the production/master graph.
	 * @returns {NamedNode}
	 */
	queryGraph(workflowId) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/tbs#queryGraph", workflowId), NamedNode);
	},
	
	/**
	 * Sets or deletes the external graph URI of the current asset collection.
	 * This function can not be called when the active graph is a working copy of an asset collection.
	 * @param {string?} value  The new external graph URI or null to remove the current value.
	 */
	setExternalGraphURI(value) {
		let predicate = graph.namedNode(teamwork.NS + 'externalGraphURI');
		let ac = teamwork.currentMasterGraph();
		if(!ac) {
			throw 'Cannot determine asset collection from current context graph';
		}
		graph.remove(ac, predicate, null);
		if(value) {
			graph.add(ac, predicate, graph.namedNode(value));
		}
	},
	
	/**
	 * Given a user ID (such as 'Administrator') this returns the email for that user (if specified).
	 * @param {string} userId  The id of the user, such as 'Administrator'.
	 * @returns {string}
	 */
	userEmail(userId) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/tbs#userEmail", userId), null);
	},
	
	/**
	 * Given a user ID (such as 'Administrator') this produces a URI resource for that user.
	 * @param {string} userId  The id of the user, such as 'Administrator'.
	 * @returns {NamedNode}
	 */
	userURI(userId) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/tbs#userURI", userId), NamedNode);
	},
	
	/**
	 * For the current workflow, this returns a JSON structure that can be used to preview what changes will be applied to which graph when the workflow gets committed.
	 * This function can not be called when the active graph is the master graph of an asset collection.
	 * WARNING: This function is marked experimental, so use at your own risk.
	 * @param {boolean?} withValidation  True to also perform SHACL constraint validation of the changed assets in the context of each edited subgraph.
	 * @returns {LiteralNode}
	 */
	workflowDiff(withValidation) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/tbs#workflowDiff", withValidation), null);
	},
	
	/**
	 * Returns the display label of a workflow identified by its ID.
	 * WARNING: This function is marked experimental, so use at your own risk.
	 * @param {string} id  The id of the workflow to get the label of.
	 * @returns {string}
	 */
	workflowLabel(id) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/tbs#workflowLabel", id), null);
	},
	
	/**
	 * Returns the status of a given workflow as a URI resource such as teamwork:Committed.
	 * @param {string} id  The id of the workflow to get the status of.
	 * @returns {NamedNode}
	 */
	workflowStatus(id) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/tbs#workflowStatus", id), NamedNode);
	},
	
	/**
	 * Returns the URI resource representing a workflow identified by its ID. This may be useful in cases where you need to query the lower-level triples of the workflow (teamwork:Tag) in the TCH graph.
	 * @param {string} id  The id of the workflow to get.
	 * @returns {NamedNode}
	 */
	workflowURI(id) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/tbs#workflowURI", id), NamedNode);
	},
	
	/**
	 * Returns the labels of all known asset collection types, for example 'Ontology'.
	 * @returns {string[]}  The singular display label of the asset collection type.
	 */
	assetCollectionTypes() {
		let query = 'SELECT ?label WHERE { () <http://topbraid.org/tbs#assetCollectionTypes> (?label) }';
		let rs = graph.select(query, {});
		return rs.bindings.map(b => RDFNodeUtil.castValue(b['label'], null));
	},
	
	/**
	 * Gets the URIs of all asset collections for which the current user has at least read access. Example results are strings such as 'urn:x-evn-master:geo'.
	 * @returns {string[]}  The URI strings.
	 */
	assetCollections() {
		let query = 'SELECT ?uri WHERE { () <http://topbraid.org/tbs#assetCollections> (?uri) }';
		let rs = graph.select(query, {});
		return rs.bindings.map(b => RDFNodeUtil.castValue(b['uri'], null));
	},
	
	/**
	 * @typedef {Object} tbs_autoComplete_Results
	 * @property {NamedNode} instance The matching instances.
	 * @property {string} label The display label of the instance. If there are multiple instances with the same label, this string will contain extra characters including the name of the type in parantheses.
	 * @property {string} realLabel For instances where multiple matches have the same label, this returns the original label, because the result variable label may contain extra characters to distinguish it from the other instances.
	 */
	
	/**
	 * Finds instances of a given class where the display label starts with a given string. This can be used to implement auto-complete boxes.
	 * @param {NamedNode} type  The class that all matching instances must have as type (or subclass thereof).
	 * @param {string} start  The string that the labels must start with (ignoring case).
	 * @param {string} langs  An optional space-separated list of language tags such as "en de" to only match English or German labels. If not provided, this will use the locale language from the surrounding HTTP request.
	 * @param {number} maxCount  The maximum number of results to return. Defaults to 100.
	 * @param {number} offset  An optional offset from which to return results. For example if offset is 10 then it will return the next 10 matches.
	 * @param {NamedNode} filterFunction  An optional URI node of a SPARQL function that is used to further filter the results. This function must take the instance as its first argument and may take up to three additional arguments as specified by the remaining arguments of the autoComplete call. The function must return true for matching instances.
	 * @param {GraphNode} filterFunctionArg2  The second argument that will be passed into the filter function, if that exists. For example, if the filter function is ex:function and the value of filterFunctionArg2 is true then it would call ex:function(?instance, true).
	 * @param {GraphNode} filterFunctionArg3  The third argument that will be passed into the filter function, if that exists.
	 * @param {GraphNode} filterFunctionArg4  The 4th argument that will be passed into the filter function, if that exists.
	 * @returns {tbs_autoComplete_Results[]}
	 */
	autoComplete(type, start, langs, maxCount, offset, filterFunction, filterFunctionArg2, filterFunctionArg3, filterFunctionArg4) {
		let query = 'SELECT ?instance ?label ?realLabel WHERE { ($type $start $langs $maxCount $offset $filterFunction $filterFunctionArg2 $filterFunctionArg3 $filterFunctionArg4) <http://topbraid.org/tbs#autoComplete> (?instance ?label ?realLabel) }';
		let rs = graph.select(query, {type: type, start: start, langs: langs, maxCount: maxCount, offset: offset, filterFunction: filterFunction, filterFunctionArg2: filterFunctionArg2, filterFunctionArg3: filterFunctionArg3, filterFunctionArg4: filterFunctionArg4});
		return rs.bindings.map(b => ({instance: RDFNodeUtil.castValue(b['instance'], NamedNode), label: RDFNodeUtil.castValue(b['label'], null), realLabel: RDFNodeUtil.castValue(b['realLabel'], null)}))
	},
	
	/**
	 * @typedef {Object} tbs_changeAddedTriples_Results
	 * @property {GraphNode} subject The subject node of the triple.
	 * @property {GraphNode} predicate The predicate node of the triple.
	 * @property {GraphNode} object The object node of the triple.
	 */
	
	/**
	 * Gets details about the triple that were added by a given change.
	 * @param {NamedNode} change  The URI resource of the change, typically produced by a prior call to tbs:changes.
	 * @returns {tbs_changeAddedTriples_Results[]}
	 */
	changeAddedTriples(change) {
		let query = 'SELECT ?subject ?predicate ?object WHERE { ($change) <http://topbraid.org/tbs#changeAddedTriples> (?subject ?predicate ?object) }';
		let rs = graph.select(query, {change: change});
		return rs.bindings.map(b => ({subject: RDFNodeUtil.castValue(b['subject'], null), predicate: RDFNodeUtil.castValue(b['predicate'], null), object: RDFNodeUtil.castValue(b['object'], null)}))
	},
	
	/**
	 * @typedef {Object} tbs_changeDeletedTriples_Results
	 * @property {GraphNode} subject The subject node of the triple.
	 * @property {GraphNode} predicate The predicate node of the triple.
	 * @property {GraphNode} object The object node of the triple.
	 */
	
	/**
	 * Gets details about the triple that were deleted by a given change.
	 * @param {NamedNode} change  The URI resource of the change, typically produced by a prior call to tbs:changes.
	 * @returns {tbs_changeDeletedTriples_Results[]}
	 */
	changeDeletedTriples(change) {
		let query = 'SELECT ?subject ?predicate ?object WHERE { ($change) <http://topbraid.org/tbs#changeDeletedTriples> (?subject ?predicate ?object) }';
		let rs = graph.select(query, {change: change});
		return rs.bindings.map(b => ({subject: RDFNodeUtil.castValue(b['subject'], null), predicate: RDFNodeUtil.castValue(b['predicate'], null), object: RDFNodeUtil.castValue(b['object'], null)}))
	},
	
	/**
	 * @typedef {Object} tbs_changes_Results
	 * @property {NamedNode} change The RDF resources representing the matching changes in the TCH graph.
	 * @property {string} comment The (optional) comment attached to the change.
	 * @property {LiteralNode} time The time stamp of the change, as xsd:dateTime.
	 * @property {string} userId The ID of the user that made the change.
	 * @property {number} addedCount The number of added triples of each change. This is only computed if returnCounts is true.
	 * @property {number} deletedCount The number of deleted triples of each change. This is only computed if returnCounts is true.
	 */
	
	/**
	 * Returns all changes stored in the change history of the current asset collection, possibly filtered by various criteria.
	 * 
	 * When called from an asset collection's master graph, it offers the option to only show the committed changes that came from a given workflow. (There is no option to show uncommitted changes here because the user may not have permission to see those).
	 * 
	 * When called from a workflow, it offers the option to only show the uncommitted changes (that are not yet on master).
	 * @param {NamedNode} about  An optional RDF node that must be mentioned in the changes that shall be returned.
	 * @param {LiteralNode} maxTime  The (optional) maximum time stamp of changes to return.
	 * @param {LiteralNode} minTime  The (optional) minimum time stamp of changes to return.
	 * @param {NamedNode} predicate  An optional URI of a property that is the predicate of the added or deleted triples of matching changes.
	 * @param {string} requiredUserId  The optional ID of a user such as 'Administrator'. If provided then only the changes made by this user will be returned.
	 * @param {boolean} committedOnly  This flag is only used when the function is called from a workflow. If set to true it will only return the local changes to the workflow, i.e. those that are not yet committed to the master copy.
	 * @param {boolean} unlimited  By default this returns up to the configured maximum number of matches. Set unlimited to true to really get all change records.
	 * @param {string} originWorkflowId  When called from an asset collection's master graph, this can be used to show only the (committed) changes that originated from a given workflow.
	 * @param {boolean} returnCounts  Set to true to also compute the values for addedCount and deletedCount. These will remain empty by default.
	 * @returns {tbs_changes_Results[]}
	 */
	changes(about, maxTime, minTime, predicate, requiredUserId, committedOnly, unlimited, originWorkflowId, returnCounts) {
		let query = 'SELECT ?change ?comment ?time ?userId ?addedCount ?deletedCount WHERE { ($about $maxTime $minTime $predicate $requiredUserId $committedOnly $unlimited $originWorkflowId $returnCounts) <http://topbraid.org/tbs#changes> (?change ?comment ?time ?userId ?addedCount ?deletedCount) }';
		let rs = graph.select(query, {about: about, maxTime: maxTime, minTime: minTime, predicate: predicate, requiredUserId: requiredUserId, committedOnly: committedOnly, unlimited: unlimited, originWorkflowId: originWorkflowId, returnCounts: returnCounts});
		return rs.bindings.map(b => ({change: RDFNodeUtil.castValue(b['change'], NamedNode), comment: RDFNodeUtil.castValue(b['comment'], null), time: RDFNodeUtil.castValue(b['time'], null), userId: RDFNodeUtil.castValue(b['userId'], null), addedCount: RDFNodeUtil.castValue(b['addedCount'], null), deletedCount: RDFNodeUtil.castValue(b['deletedCount'], null)}))
	},
	
	/**
	 * @typedef {Object} tbs_governanceRoles_Results
	 * @property {string} role The label of the role, such as 'data steward'.
	 * @property {GraphNode} party The party that has the role, e.g. the URI of a user.
	 */
	
	/**
	 * Gets the governance roles that have been assigned for the current asset collection.
	 * @returns {tbs_governanceRoles_Results[]}
	 */
	governanceRoles() {
		let query = 'SELECT ?role ?party WHERE { () <http://topbraid.org/tbs#governanceRoles> (?role ?party) }';
		let rs = graph.select(query, {});
		return rs.bindings.map(b => ({role: RDFNodeUtil.castValue(b['role'], null), party: RDFNodeUtil.castValue(b['party'], null)}))
	},
	
	/**
	 * @typedef {Object} tbs_namespacePrefixes_Results
	 * @property {string} namespace The namespace.
	 * @property {string} prefix The prefix.
	 */
	
	/**
	 * Gets the declared namespace-prefix pairs of the current asset collection.
	 * @param {boolean} withoutImports  True to only return the prefixes that are directly declared at the base graph, i.e. not from owl:imported graphs.
	 * @returns {tbs_namespacePrefixes_Results[]}
	 */
	namespacePrefixes(withoutImports) {
		let query = 'SELECT ?namespace ?prefix WHERE { ($withoutImports) <http://topbraid.org/tbs#namespacePrefixes> (?namespace ?prefix) }';
		let rs = graph.select(query, {withoutImports: withoutImports});
		return rs.bindings.map(b => ({namespace: RDFNodeUtil.castValue(b['namespace'], null), prefix: RDFNodeUtil.castValue(b['prefix'], null)}))
	},
	
	/**
	 * For the current workflow, this returns the new workflow statuses that can be reached by currently possible transitions, for the current user. This can only be called with the workflow as active query graph.
	 * @returns {NamedNode[]}  The new status(es) that can be reached from the current status.
	 */
	possibleNextWorkflowStatuses() {
		let query = 'SELECT ?newStatus WHERE { () <http://topbraid.org/tbs#possibleNextWorkflowStatuses> (?newStatus) }';
		let rs = graph.select(query, {});
		return rs.bindings.map(b => RDFNodeUtil.castValue(b['newStatus'], NamedNode));
	},
	
	/**
	 * @typedef {Object} tbs_remoteMatches_Results
	 * @property {NamedNode} local The resulting local match (one of the given resources).
	 * @property {NamedNode} remote The resulting remote match.
	 */
	
	/**
	 * Fetches the remote matches for a given set of local resources. See the documentation section for remote matching.
	 * Example: ( ex:MyProperty-localProp "uri1 uri2 uri3" ) tbs:remoteMatches ( ?local ?remote ) .
	 * WARNING: This function is marked experimental, so use at your own risk.
	 * @param {sh_PropertyShape} propertyShape  The property shape that defines the sh:class, tosh:localMatchProperty, tosh:remoteMatchProperty and sh:path.
	 * @param {string} resources  A space-separated list of URIs for the local resources to match.
	 * @returns {tbs_remoteMatches_Results[]}
	 */
	remoteMatches(propertyShape, resources) {
		let query = 'SELECT ?local ?remote WHERE { ($propertyShape $resources) <http://topbraid.org/tbs#remoteMatches> (?local ?remote) }';
		let rs = graph.select(query, {propertyShape: propertyShape, resources: resources});
		return rs.bindings.map(b => ({local: RDFNodeUtil.castValue(b['local'], NamedNode), remote: RDFNodeUtil.castValue(b['remote'], NamedNode)}))
	},
	
	/**
	 * @typedef {Object} tbs_users_Results
	 * @property {string} id The user id, e.g. 'Administrator'.
	 * @property {string} label A display label for the user.
	 */
	
	/**
	 * Gets a certain number of known users, possibly filtered by a pattern string.
	 * @param {string} pattern  A substring that must exist in the user display label.
	 * @param {number} limit  The maximum number of matches to return. Assumed infinite if unspecified.
	 * @returns {tbs_users_Results[]}
	 */
	users(pattern, limit) {
		let query = 'SELECT ?id ?label WHERE { ($pattern $limit) <http://topbraid.org/tbs#users> (?id ?label) }';
		let rs = graph.select(query, {pattern: pattern, limit: limit});
		return rs.bindings.map(b => ({id: RDFNodeUtil.castValue(b['id'], null), label: RDFNodeUtil.castValue(b['label'], null)}))
	},
	
	/**
	 * @typedef {Object} tbs_validate_Results
	 * @property {GraphNode} focusNode The focus node of the validation result.
	 * @property {string} pathExpression The path of the validation result, as a SPARQL path string.
	 * @property {GraphNode} value The value node of the validation result.
	 * @property {NamedNode} constraintComponent The constraint component of the validation result, derived from sh:sourceConstraintComponent.
	 * @property {string} severity The local name of the severity of the validation result: "Info", "Warning" or "Violation".
	 * @property {string} message The message of the validation result, in the most suitable language if applicable.
	 */
	
	/**
	 * Performs SHACL validation on the current graph or a selected focus node from the current graph.
	 * @param {GraphNode} targetNode  The (optional) node to validate. Validates the whole graph if unspecified.
	 * @param {GraphNode} shapesGraph  An optional shapes graph to use. If unspecified, the current context graph will be used as shapes graph.
	 * @returns {tbs_validate_Results[]}
	 */
	validate(targetNode, shapesGraph) {
		let query = 'SELECT ?focusNode ?pathExpression ?value ?constraintComponent ?severity ?message WHERE { ($targetNode $shapesGraph) <http://topbraid.org/tbs#validate> (?focusNode ?pathExpression ?value ?constraintComponent ?severity ?message) }';
		let rs = graph.select(query, {targetNode: targetNode, shapesGraph: shapesGraph});
		return rs.bindings.map(b => ({focusNode: RDFNodeUtil.castValue(b['focusNode'], null), pathExpression: RDFNodeUtil.castValue(b['pathExpression'], null), value: RDFNodeUtil.castValue(b['value'], null), constraintComponent: RDFNodeUtil.castValue(b['constraintComponent'], NamedNode), severity: RDFNodeUtil.castValue(b['severity'], null), message: RDFNodeUtil.castValue(b['message'], null)}))
	},
	
	/**
	 * @typedef {Object} tbs_validateWorkflow_Results
	 * @property {GraphNode} focusNode The focus node of the validation result.
	 * @property {string} pathExpression The path of the validation result, as a SPARQL path string.
	 * @property {GraphNode} value The value node of the validation result.
	 * @property {NamedNode} constraintComponent The constraint component of the validation result, derived from sh:sourceConstraintComponent.
	 * @property {string} severity The local name of the severity of the validation result: "Info", "Warning" or "Violation".
	 * @property {string} message The message of the validation result, in the most suitable language if applicable.
	 */
	
	/**
	 * Performs SHACL validation on resources that appear as subjects or objects of added or deleted triples in the current workflow.
	 * This function can not be called when the active graph is the master graph of an asset collection.
	 * WARNING: This function is marked experimental, so use at your own risk.
	 * @returns {tbs_validateWorkflow_Results[]}
	 */
	validateWorkflow() {
		let query = 'SELECT ?focusNode ?pathExpression ?value ?constraintComponent ?severity ?message WHERE { () <http://topbraid.org/tbs#validateWorkflow> (?focusNode ?pathExpression ?value ?constraintComponent ?severity ?message) }';
		let rs = graph.select(query, {});
		return rs.bindings.map(b => ({focusNode: RDFNodeUtil.castValue(b['focusNode'], null), pathExpression: RDFNodeUtil.castValue(b['pathExpression'], null), value: RDFNodeUtil.castValue(b['value'], null), constraintComponent: RDFNodeUtil.castValue(b['constraintComponent'], NamedNode), severity: RDFNodeUtil.castValue(b['severity'], null), message: RDFNodeUtil.castValue(b['message'], null)}))
	},
	
	/**
	 * Gets the list of the IDs of all workflows for the current asset collection. The results are returned regardless of permissions.
	 * @returns {string[]}  The workflow ids.
	 */
	workflows() {
		let query = 'SELECT ?id WHERE { () <http://topbraid.org/tbs#workflows> (?id) }';
		let rs = graph.select(query, {});
		return rs.bindings.map(b => RDFNodeUtil.castValue(b['id'], null));
	},
	
	
	// Generated from SWP script http://topbraid.org/tbs#addGovernanceRole
	
	/**
	 * Adds a governance role (such as 'responsible') for a given user or organization to the current asset collection.
	 * 
	 * This operation is allowed for administrators or managers of the asset collection only.
	 * This function can not be called when the active graph is a working copy of an asset collection.
	 * @param {NamedNode} party  The user or organization to add. For users this must be a URI in the format returned by tbs:userURI().
	 * @param {string} role  The label of the role, e.g. 'data steward'.
	 * @returns {boolean}
	 */
	addGovernanceRole(party, role) {
		let result = graph.swp('http://topbraid.org/tbs#addGovernanceRole', {party, role});
		return JSON.parse(result);
	},
	
	// Generated from SWP script http://topbraid.org/tbs#addPermission
	
	/**
	 * Adds a permission role (viewer, editor or manager) for a given user or organization to the current asset collection or a given workflow.
	 * 
	 * This operation is allowed for administrators or managers of the asset collection or the workflow only.
	 * @param {NamedNode} party  The user or organization to add. For users this must be a URI in the format returned by tbs:userURI().
	 * @param {string} permission  Either 'viewer', 'editor' or 'manager'.
	 * @param {string} workflowId  The id of a workflow to add the permission for. If unspecified, this will add the permission for the asset collection (master graph) itself.
	 * @returns {boolean}
	 */
	addPermission(party, permission, workflowId) {
		let result = graph.swp('http://topbraid.org/tbs#addPermission', {party, permission, workflowId});
		return JSON.parse(result);
	},
	
	// Generated from SWP script http://topbraid.org/tbs#clearAssetCollection
	
	/**
	 * Clears the content of the current asset collection.
	 * This function can not be called when the active graph is a working copy of an asset collection.
	 * @returns {Object}
	 */
	clearAssetCollection() {
		let result = graph.swp('http://topbraid.org/tbs#clearAssetCollection', {});
		return JSON.parse(result);
	},
	
	// Generated from SWP script http://topbraid.org/tbs#createAssetCollection
	
	/**
	 * @typedef {Object} createAssetCollection_Parameters
	 * @property {string?} defaultNamespace The default namespace that shall be used for new resources.
	 * @property {string?} description The human-readable description of the new asset collection.
	 * @property {string?} id An optional internal identifier of the asset collection. If none is provided then the system will auto-generate an id from the name.
	
	If you do provide an id, note that it must follow strict naming conventions: it must start with a letter and then consist only of letters, digits or the underscore. The letters are typically lower-case.
	 * @property {string} name The human-readable name of the asset collection.
	 * @property {string} typeLabel The (singular) label of the collection type, e.g. 'Ontology'.
	 */
	
	/**
	 * Creates a new asset collection of a given type. The new collection will have the current user as manager and no other role assignments. The result string is the ID of the new asset collection.
	 * @param {createAssetCollection_Parameters} params  the parameters object
	 * @returns {string}
	 */
	createAssetCollection(params) {
		let result = graph.swp('http://topbraid.org/tbs#createAssetCollection', params);
		return JSON.parse(result);
	},
	
	// Generated from SWP script http://topbraid.org/tbs#createWorkflow
	
	/**
	 * @typedef {Object} createWorkflow_Parameters
	 * @property {string?} description The optional description of the workflow.
	 * @property {string?} editableSubGraphs An optional space-separated string consisting of URIs of the imported graphs that shall become editable alongside the base graph.
	 * @property {NamedNode?} editedAsset The RDF resource that is the main edited asset in this workflow.
	 * @property {string} name The name/label of the workflow.
	 * @property {string?} workflowTemplateLabel The label of the workflow template to use. Falls back to the default workflow template.
	 */
	
	/**
	 * Starts a new workflow in the current asset collection and returns the ID of that workflow.
	 * @param {createWorkflow_Parameters} params  the parameters object
	 * @returns {string}
	 */
	createWorkflow(params) {
		let result = graph.swp('http://topbraid.org/tbs#createWorkflow', params);
		return JSON.parse(result);
	},
	
	// Generated from SWP script http://topbraid.org/tbs#deleteAssetCollection
	
	/**
	 * Deletes an asset collection and all associated data from TCH graphs. This is (obviously) an operation that should be used with care. You need to be a manager of the asset collection or an administrator of the system.
	 * This function can not be called when the active graph is a working copy of an asset collection.
	 * @param {string} id  The id of the asset collection, e.g. 'geo'.
	 * @returns {boolean}
	 */
	deleteAssetCollection(id) {
		let result = graph.swp('http://topbraid.org/tbs#deleteAssetCollection', {id});
		return JSON.parse(result);
	},
	
	// Generated from SWP script http://topbraid.org/tbs#deleteWorkflow
	
	/**
	 * Deletes a workflow (programmatically), without further checks. Only managers of the asset collection or the workflow can perform this operation. The context graph needs to be the (master graph of the) asset collection.
	 * This function can not be called when the active graph is a working copy of an asset collection.
	 * @param {string} workflowId  The id of the workflow to delete.
	 * @returns {boolean}
	 */
	deleteWorkflow(workflowId) {
		let result = graph.swp('http://topbraid.org/tbs#deleteWorkflow', {workflowId});
		return JSON.parse(result);
	},
	
	// Generated from SWP script http://topbraid.org/tbs#executeRules
	
	/**
	 * Executes all SHACL or SPIN rules defined for the query graph and asserts the resulting triples.
	 * 
	 * Returns the number of inferred triples.
	 * @param {boolean} direct  If set to true then the assertions will directly be stored in the master graph. This will bypass the change history and also make it harder to revert those changes, but offers better performance and less overhead for large rule sets.
	 * @param {boolean} revertOldInferences  If set to true then any previously inferred triples (from a similar function call) that are not among the new inferences will be reverted.
	 * @returns {number}
	 */
	executeRules(direct, revertOldInferences) {
		let result = graph.swp('http://topbraid.org/tbs#executeRules', {direct, revertOldInferences});
		return JSON.parse(result);
	},
	
	// Generated from SWP script http://topbraid.org/tbs#loadRemoteReferences
	
	/**
	 * Makes sure that the incoming references to a given remote resource is loaded from the remote data source into the local TopBraid database.
	 * @param {number} maxCount  The maximum number of references to load.
	 * @param {NamedNode} resource  A URI resource that the references to shall be loaded.
	 * @returns {boolean}
	 */
	loadRemoteReferences(maxCount, resource) {
		let result = graph.swp('http://topbraid.org/tbs#loadRemoteReferences', {maxCount, resource});
		return JSON.parse(result);
	},
	
	// Generated from SWP script http://topbraid.org/tbs#loadRemoteResources
	
	/**
	 * @typedef {Object} loadRemoteResources_Parameters
	 * @property {boolean?} baseInfo True to only load the base info properties (type and labels).
	 * @property {boolean?} forced True if the reload should be forced even if the resource was loaded before.
	 * @property {number?} maxDepth Maximum depth of recursive loading.
	 * @property {number?} maxResourceCount Maximum number of resources to load recursively.
	 * @property {number?} maxSeconds Maximum number of seconds of recursive loading.
	 * @property {string?} progressId An optional progress id.
	 * @property {boolean?} recursive True to also load resources that are linked from the loaded resources.
	 * @property {string?} recursiveProperties By default the recursive mode will traverse all properties of the loaded resources. Use "children" to only follow the narrower concepts or "parents" to only follow the broader concept relationships. This uses skos:broader and skos:hasTopConcept.
	 * @property {string?} resources A space-separated list of URIs of the (remote) resources to resolve. If left empty then all instances of the classes represented via tosh:remoteClass will be loaded.
	 */
	
	/**
	 * Makes sure that certain remote resources are loaded from the remote data source into the local TopBraid database.
	 * @param {loadRemoteResources_Parameters} params  the parameters object
	 * @returns {LiteralNode}
	 */
	loadRemoteResources(params) {
		let result = graph.swp('http://topbraid.org/tbs#loadRemoteResources', params);
		return JSON.parse(result);
	},
	
	// Generated from SWP script http://topbraid.org/tbs#refreshRemoteMatches
	
	/**
	 * Using the remote data matches defined using tosh:localMatchProperty etc, this refreshes the local links to the remote objects for a provided list of subjects or all applicable subjects in the current base graph if arg:resources is omitted. See the documentation on remote data matching for background.
	 * @param {string} resources  A space-separated list of URIs of the (remote) resources to resolve.
	 * @returns {LiteralNode}
	 */
	refreshRemoteMatches(resources) {
		let result = graph.swp('http://topbraid.org/tbs#refreshRemoteMatches', {resources});
		return JSON.parse(result);
	},
	
	// Generated from SWP script http://topbraid.org/tbs#refreshWorkspace
	
	/**
	 * Executable by administrators, this refreshes the workspace programmatically, like the Refresh button on the Files page. This updates various internal registries based on the latest files and graphs in the workspace.
	 * @returns {boolean}
	 */
	refreshWorkspace() {
		let result = graph.swp('http://topbraid.org/tbs#refreshWorkspace', {});
		return JSON.parse(result);
	},
	
	// Generated from SWP script http://topbraid.org/tbs#removeGovernanceRole
	
	/**
	 * Removes a governance role (such as 'responsible') for a given user or organization from the current asset collection.
	 * 
	 * This operation is allowed for administrators or managers of the asset collection only.
	 * This function can not be called when the active graph is a working copy of an asset collection.
	 * @param {NamedNode} party  The user or organization to add. For users this must be a URI in the format returned by tbs:userURI().
	 * @param {string} role  The label of the role, e.g. 'data steward'.
	 * @returns {boolean}
	 */
	removeGovernanceRole(party, role) {
		let result = graph.swp('http://topbraid.org/tbs#removeGovernanceRole', {party, role});
		return JSON.parse(result);
	},
	
	// Generated from SWP script http://topbraid.org/tbs#removePermission
	
	/**
	 * Removes a permission role (viewer, editor or manager) for a given user or organization to the current asset collection or a given workflow.
	 * 
	 * This operation is allowed for administrators or managers of the asset collection or the workflow only.
	 * @param {NamedNode} party  The user or organization to remove. For users this must be a URI in the format returned by tbs:userURI().
	 * @param {string} permission  Either 'viewer', 'editor' or 'manager'.
	 * @param {string} workflowId  The id of a workflow to remove the permission for. If unspecified, this will remove the permission for the asset collection (master graph) itself.
	 * @returns {boolean}
	 */
	removePermission(party, permission, workflowId) {
		let result = graph.swp('http://topbraid.org/tbs#removePermission', {party, permission, workflowId});
		return JSON.parse(result);
	},
	
	// Generated from SWP script http://topbraid.org/tbs#resetRemoteStorage
	
	/**
	 * Resets the remote storage data structures and cache content for the current asset collection.
	 * @returns {boolean}
	 */
	resetRemoteStorage() {
		let result = graph.swp('http://topbraid.org/tbs#resetRemoteStorage', {});
		return JSON.parse(result);
	},
	
	// Generated from SWP script http://topbraid.org/tbs#sendEmail
	
	/**
	 * Assuming that SMTP has been configured by the admin, this will send an email from the TopBraid EDG server, for example to notify users about certain changes.
	 * 
	 * Note that the function will return immediately without confirming that the email was actually sent. So when the server is configured it will always return true even if there were technical problems preventing the actual email from going out.
	 * @param {string} body  The body text of the email.
	 * @param {string} subject  The subject line of the email.
	 * @param {string} to  The email address of the receiver(s).
	 * @returns {boolean}
	 */
	sendEmail(body, subject, to) {
		let result = graph.swp('http://topbraid.org/tbs#sendEmail', {body, subject, to});
		return JSON.parse(result);
	},
	
	// Generated from SWP script http://topbraid.org/tbs#setConfigValue
	
	/**
	 * For administrators, this can be used to programmatically change one of the configuration parameters. This is, obviously, an operation that needs to be treated with care.
	 * @param {string} name  The name of the configuration, which corresponds to the local name of a property from the cfg namespace such as "enableSPARQLUpdates".
	 * @param value  The new value, or no value to unset the property.
	 * @returns {Object}
	 */
	setConfigValue(name, value) {
		let result = graph.swp('http://topbraid.org/tbs#setConfigValue', {name, value});
		return JSON.parse(result);
	},
	
	// Generated from SWP script http://topbraid.org/tbs#setWorkflowStatus
	
	/**
	 * Changes the status of the current workflow to a given status, represented by a URI. This requires that there is a valid transition from the current workflow status and the new status. The system will also perform any side effects of the workflow transition.
	 * 
	 * Setting the status to 'http://topbraid.org/teamwork#Committed' will in fact commit the workflow.
	 * 
	 * This operation is only permitted for managers of the asset collection, the administrator or a user that is allowed to make the transition.
	 * 
	 * The currently active query graph must be the workflow that is being changed.
	 * 
	 * The return value is true if successful but exceptions may get thrown if something went wrong.
	 * This function can not be called when the active graph is the master graph of an asset collection.
	 * @param {NamedNode} status  The new status of the workflow. Example values are 'http://topbraid.org/teamwork#Committed' or 'http://topbraid.org/teamwork#Uncommitted'.
	 * @returns {boolean}
	 */
	setWorkflowStatus(status) {
		let result = graph.swp('http://topbraid.org/tbs#setWorkflowStatus', {status});
		return JSON.parse(result);
	},
	
	NS: "http://topbraid.org/tbs#",
	PREFIX: "tbs",
}


/**
 * Generated from the namespace <http://topbraid.org/teamwork#>
 */
const teamwork = {

	/**
	 * Gets the base URI (as a Resource) of the graph containing the registered users and roles of this TopBraid Live server.
	 * @returns {NamedNode}
	 */
	authGraph() {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#authGraph"), NamedNode);
	},
	
	/**
	 * Gets the asset collection id of the current query graph.
	 * @returns {string}
	 */
	currentGraphId() {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#currentGraphId"), null);
	},
	
	/**
	 * Checks whether the current query graph is a master graph and not a working copy.
	 * @returns {boolean}
	 */
	currentGraphIsMasterGraph() {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#currentGraphIsMasterGraph"), null);
	},
	
	/**
	 * Checks whether the current query graph is a working copy.
	 * @returns {boolean}
	 */
	currentGraphIsTag() {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#currentGraphIsTag"), null);
	},
	
	/**
	 * Gets the master graph associated with the current query graph.
	 * @returns {NamedNode}
	 */
	currentMasterGraph() {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#currentMasterGraph"), NamedNode);
	},
	
	/**
	 * Gets the tag (resource) from the current query graph.
	 */
	currentTag() {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#currentTag"), null);
	},
	
	/**
	 * Gets the id of the current query graph - or unbound if the user is currently in a master graph.
	 * @returns {string}
	 */
	currentTagId() {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#currentTagId"), null);
	},
	
	/**
	 * Gets the team graph (tch file) associated with the current SWP query graph.
	 * @returns {NamedNode}
	 */
	currentTeamGraph() {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#currentTeamGraph"), NamedNode);
	},
	
	/**
	 * Checks if the current user has sufficient privileges to create a new working copy/workflow for a given vocabulary. This is true if the user has at least explicitly assigned viewer permissions (via teamwork:viewer etc) or one of the governance roles is not marked with teamwork:cannotCreateTags true.
	 * @param {NamedNode} projectGraph  The vocabulary to potentially create a working copy for.
	 * @returns {boolean}
	 */
	currentUserCanCreateTags(projectGraph) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#currentUserCanCreateTags", projectGraph), null);
	},
	
	/**
	 * Checks whether the current user can perform a given resource status transition on a given resource. The query graph is assumed to contain the resource. Currently this only supports checking for the teamwork:requiredGovernanceRole. Future versions may allow broader checks against the shape of the resource, but this may be an expensive operation.
	 * WARNING: This function is marked experimental, so use at your own risk.
	 * @param {NamedNode} resource  The resource to (potentially) transition.
	 * @param {NamedNode} teamGraph  The current TCH graph.
	 * @param {NamedNode} transition  The transition to (potentially) perform.
	 * @returns {boolean}
	 */
	currentUserCanPerformResourceStatusTransition(resource, teamGraph, transition) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#currentUserCanPerformResourceStatusTransition", resource, teamGraph, transition), null);
	},
	
	/**
	 * Checks whether the current user is manager of a given asset collection.
	 * @param {NamedNode} projectGraph  The project graph.
	 * @returns {boolean}
	 */
	currentUserIsProjectManager(projectGraph) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#currentUserIsProjectManager", projectGraph), null);
	},
	
	/**
	 * WARNING: This function is marked experimental, so use at your own risk.
	 * @param projectGraph  The master graph.
	 * @param {NamedNode} tag  The working copy.
	 * @param {NamedNode} transition  The transition.
	 * @returns {NamedNode}
	 */
	currentUserTransitionVote(projectGraph, tag, transition) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#currentUserTransitionVote", projectGraph, tag, transition), NamedNode);
	},
	
	/**
	 * Produces a relative URL to open the editor for a given project graph, optionally with a "deep link" to a given resource and/or a given working copy.
	 * @param {NamedNode} projectGraph  The master graph to open.
	 * @param {NamedNode?} resource  The resource to deep link to.
	 * @param {NamedNode?} tag  The tag to produce a link for.
	 * @param {boolean?} tagIgnoreEditedResource  If set to true, the edited resource of ?tag (if any) will be ignored, and the editor won't start with the resource selected.
	 * @returns {string}
	 */
	editorLink(projectGraph, resource, tag, tagIgnoreEditedResource) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#editorLink", projectGraph, resource, tag, tagIgnoreEditedResource), null);
	},
	
	/**
	 * Gets the declared teamwork:mainClass of a vocabulary, falling back to the mainClass defined at its project type.
	 * @param {NamedNode} projectGraph  The vocabulary.
	 * @returns {rdfs_Class}
	 */
	getMainClass(projectGraph) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#getMainClass", projectGraph), rdfs_Class);
	},
	
	/**
	 * Gets the abbreviation (e.g. "EDG") of the current teamwork:Product.
	 * @returns {string}
	 */
	getProductAbbreviation() {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#getProductAbbreviation"), null);
	},
	
	/**
	 * Gets the teamwork:ProjectType of a project identified by its project graph, or nothing if the argument is not a teamwork project. The name of this function starts with "get" to distinguish it from the property teamwork:projectType.
	 * 
	 * The function is implemented natively because it needs to bypass some security features.
	 * @param {NamedNode} projectGraph  The asset collection graph.
	 * @returns {NamedNode}
	 */
	getProjectType(projectGraph) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#getProjectType", projectGraph), NamedNode);
	},
	
	/**
	 * Gets the standard query graph for a given master graph (?projectGraph) and optional working copy (?tag). The result will be a graph with imports including the user name, so writes to these graphs will be recorded in the change history.
	 * @param {NamedNode?} projectGraph  The master graph.
	 * @param {NamedNode?} tag  The working copy.
	 * @returns {NamedNode}
	 */
	getQueryGraph(projectGraph, tag) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#getQueryGraph", projectGraph, tag), NamedNode);
	},
	
	/**
	 * Gets the id from a graph - either a master graph or a tag graph.
	 * @param {owl_Ontology} graph  The graph URI to get the id of.
	 */
	graphIdFromGraph(graph) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#graphIdFromGraph", graph), null);
	},
	
	/**
	 * Given a team graph, return the master graph id.
	 * @param {owl_Ontology} graph  The graph URI to get the id of.
	 */
	graphIdFromTeamGraph(graph) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#graphIdFromTeamGraph", graph), null);
	},
	
	/**
	 * Checks whether a given graph (identified by its base URI, ?arg1) is under team control.
	 * @param {NamedNode} arg1  The base URI (resource) of the main file to check.
	 * @returns {boolean}
	 */
	hasTeamGraph(arg1) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#hasTeamGraph", arg1), null);
	},
	
	/**
	 * Checks if GeoSPARQL has been enabled for a given master graph.
	 * @param {NamedNode} projectGraph  The master graph to check.
	 * @returns {boolean}
	 */
	isGeoSPARQLEnabled(projectGraph) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#isGeoSPARQLEnabled", projectGraph), null);
	},
	
	/**
	 * Checks whether a given project (master graph) is an Ontology, as defined by the presence of teamwork:isOntologyProjectType true for its project type.
	 * @param {NamedNode} projectGraph  The master graph.
	 * @returns {boolean}
	 */
	isOntology(projectGraph) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#isOntology", projectGraph), null);
	},
	
	/**
	 * Checks whether a given teamwork:ProjectType has been disabled by the admin.
	 * @param {NamedNode} projectType  The ProjectType to check.
	 * @returns {boolean}
	 */
	isProjectTypeDisabled(projectType) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#isProjectTypeDisabled", projectType), null);
	},
	
	/**
	 * Checks if a given project graph has been marked as protected. See teamwork:protected.
	 * @param {NamedNode} projectGraph  The master graph to check.
	 * @returns {boolean}
	 */
	isProtectedProject(projectGraph) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#isProtectedProject", projectGraph), null);
	},
	
	/**
	 * Checks if a given project graph has been marked as read-only. See teamwork:readOnly.
	 * @param {NamedNode} projectGraph  The master graph to check.
	 * @returns {boolean}
	 */
	isReadOnlyProject(projectGraph) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#isReadOnlyProject", projectGraph), null);
	},
	
	/**
	 * Checks whether a given resource is read-only (in the current editing context). A resource is read-only if all of its types are read-only, using teamwork:isReadOnlyType().
	 * @param {NamedNode} resource  The resource to check.
	 * @returns {boolean}
	 */
	isReadOnlyResource(resource) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#isReadOnlyResource", resource), null);
	},
	
	/**
	 * Checks whether the current editor can edit resources of a given class. This uses the provided project type to look up another SPIN function that does the real work.
	 * @param {rdfs_Class} resourceType  The class to check.
	 * @returns {boolean}
	 */
	isReadOnlyType(resourceType) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#isReadOnlyType", resourceType), null);
	},
	
	/**
	 * WARNING: This function is marked experimental, so use at your own risk.
	 * @param projectGraph
	 * @returns {boolean}
	 */
	isRemoteAssetCollection(projectGraph) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#isRemoteAssetCollection", projectGraph), null);
	},
	
	/**
	 * WARNING: This function is marked experimental, so use at your own risk.
	 * @param projectGraph
	 * @returns {boolean}
	 */
	isRemoteAssetCollectionEditable(projectGraph) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#isRemoteAssetCollectionEditable", projectGraph), null);
	},
	
	/**
	 * Checks whether a given vocabulary type is marked as a singleton, allowing only a single instance of its kind.
	 * @param {NamedNode} projectType  The vocabulary type to check.
	 * @returns {boolean}
	 */
	isSingletonProjectType(projectType) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#isSingletonProjectType", projectType), null);
	},
	
	/**
	 * Gets the associated master graph for a TCH graph (by removing the .tch ending of the base graph).
	 * @param {NamedNode} teamGraph  The TCH graph (may be a ui:graphWithImports).
	 * @returns {NamedNode}
	 */
	masterGraphForTeamGraph(teamGraph) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#masterGraphForTeamGraph", teamGraph), NamedNode);
	},
	
	/**
	 * Gets the base URI (as a Resource) of the graph containing the governance roles. This does not include the owl:imports, so wrap this with ui:graphWithImports if needed.
	 * 
	 * Usually this is not needed directly, but instead query teamwork:workflowsGraph().
	 * @returns {NamedNode}
	 */
	platformGovernanceGraph() {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#platformGovernanceGraph"), NamedNode);
	},
	
	/**
	 * Gets a label in plural form describing a given project type, such as"Taxonomies" or "Ontologies".
	 * @param {NamedNode} projectType  The project type (URI resource).
	 * @returns {string}
	 */
	pluralProjectTypeLabel(projectType) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#pluralProjectTypeLabel", projectType), null);
	},
	
	/**
	 * Gets the label of the active Product, as defined by teamwork:product.
	 * @returns {string}
	 */
	productLabel() {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#productLabel"), null);
	},
	
	/**
	 * Gets the display label of a given vocabulary/project.
	 * @param {NamedNode} projectGraph  The project graph (URI resource).
	 * @returns {string}
	 */
	projectLabel(projectGraph) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#projectLabel", projectGraph), null);
	},
	
	/**
	 * Constructs the graph IRI that is used to edit a given vocabulary/working copy for a given user.
	 * @param {boolean} editable  True to return the graph for edit mode.
	 * @param {string} graphId  The graph id, e.g. "geo".
	 * @param {string?} tagId  The id of the tag (working copy).
	 * @param {string?} userName  The name of the user.
	 */
	queryGraph(editable, graphId, tagId, userName) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#queryGraph", editable, graphId, tagId, userName), null);
	},
	
	/**
	 * Returns the URL of a declared icon based on dash:IconRole property roles. Returns nothing if no such icon has been declared.
	 * @param focusNode  The resource to get the icon for.
	 * @param projectGraph  The master graph to operate on.
	 * @returns {string}
	 */
	resourceIcon(focusNode, projectGraph) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#resourceIcon", focusNode, projectGraph), null);
	},
	
	/**
	 * Returns a JSON object with fields suitable to render resource summaries, e.g. in hover tooltip boxes. The info is based on suitable property roles.
	 * @param focusNode  The resource to get the summary for.
	 * @param projectGraph  The master graph to operate on.
	 * @returns {LiteralNode}
	 */
	resourceSummaryInfo(focusNode, projectGraph) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#resourceSummaryInfo", focusNode, projectGraph), null);
	},
	
	/**
	 * Returns the name of the workspace project that contains Teamwork-managed graphs, usually "Repositories".
	 */
	rootProjectName() {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#rootProjectName"), null);
	},
	
	/**
	 * Gets a label describing a given project type, such as "Taxonomy" or "Ontology".
	 * @param {NamedNode} projectType  The project type.
	 * @returns {string}
	 */
	singularProjectTypeLabel(projectType) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#singularProjectTypeLabel", projectType), null);
	},
	
	/**
	 * Gets the Tag (resource) for a given id.
	 * @param {string} tagId  The id of the tag to get.
	 * @returns {NamedNode}
	 */
	tagById(tagId) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#tagById", tagId), NamedNode);
	},
	
	/**
	 * Gets the id of a given tag (resource) - the part after urn:x-tags:.
	 * @param {NamedNode} tag  The tag to get the id of.
	 * @returns {string}
	 */
	tagId(tag) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#tagId", tag), null);
	},
	
	/**
	 * Delivers the label of a tag without the overhead of having to switch context graphs etc.
	 * @param {owl_Ontology} projectGraph
	 * @param {NamedNode} tag
	 * @returns {string}
	 */
	tagLabel(projectGraph, tag) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#tagLabel", projectGraph, tag), null);
	},
	
	/**
	 * Delivers the base URI of the team graph (tch file) for a given base URI (?arg1).
	 * In a typical use case, the call sequence would be:
	 * 
	 * FILTER (teamwork:hasTeamGraph(?baseURI)) .
	 * BIND (teamwork:teamGraph(?baseURI) AS ?teamGraph) .
	 * ...
	 * @param {NamedNode} arg1  The base URI (resource) of the main file to get the team graph URI of.
	 * @returns {NamedNode}
	 */
	teamGraph(arg1) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#teamGraph", arg1), NamedNode);
	},
	
	/**
	 * Creates the graph URI for a virtual union graph consisting of all graphs under teamwork control that the current user has access to.
	 * @returns {NamedNode}
	 */
	unionGraphForCurrentUser() {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#unionGraphForCurrentUser"), NamedNode);
	},
	
	/**
	 * Checks whether a given user is either equivalent to the given argument, or is member of the given security (LDAP) group or is affiliated with an organization that is given as argument.
	 * @param {NamedNode} party  The party that the current user is matched against.
	 * @param {NamedNode} user  The user resource.
	 * @returns {boolean}
	 */
	userHasParty(party, user) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#userHasParty", party, user), null);
	},
	
	/**
	 * Gets the base URI (as a Resource) of the graph containing the registered users of this TopBraid server. Note that this is not teamwork:userDataGraph().
	 * @returns {NamedNode}
	 */
	usersGraph() {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#usersGraph"), NamedNode);
	},
	
	/**
	 * The SPARQL function teamwork:value gets the "first" value of a given subject/predicate combination, including values that may be defined by sh:values rules.  If there are multiple values, it will pick the asserted value first but even that in a random order. So this function is best used in controlled scenarios where the context ensures that at most only one value can exist.
	 * WARNING: This function is marked experimental, so use at your own risk.
	 * @param {NamedNode} focusNode  The subject.
	 * @param {rdf_Property} predicate  The predicate.
	 * @param {NamedNode} teamworkMasterGraph  The master graph, such as <urn:x-evn-master:geo> - this is needed to efficiently cache the values rules.
	 */
	value(focusNode, predicate, teamworkMasterGraph) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#value", focusNode, predicate, teamworkMasterGraph), null);
	},
	
	/**
	 * Gets the URI of the (system) graph holding the workflow customizations, i.e. the workflow instances edited by the user.
	 * @returns {NamedNode}
	 */
	workflowCustomizationsGraph() {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#workflowCustomizationsGraph"), NamedNode);
	},
	
	/**
	 * Returns the named graph containing all Workflow templates. This includes the graph containing the editable workflows plus its owl:imports (which include the teamwork system namespace).
	 * @returns {NamedNode}
	 */
	workflowsGraph() {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/teamwork#workflowsGraph"), NamedNode);
	},
	
	
	// Generated from SWP script http://topbraid.org/teamwork#getWorkflowTemplate
	
	/**
	 * Returns the description and possible transitions for the provided workflow template.
	 * @param {NamedNode} template
	 * @returns {string}
	 */
	getWorkflowTemplate(template) {
		let result = graph.swp('http://topbraid.org/teamwork#getWorkflowTemplate', {template});
		return JSON.parse(result);
	},
	
	// Generated from SWP script http://topbraid.org/teamwork#getWorkflowTemplates
	
	/**
	 * Returns a list of available workflow templates.
	 * @param {NamedNode} editedAsset  The RDF resource that is the main edited asset in this workflow.
	 * @returns {string}
	 */
	getWorkflowTemplates(editedAsset) {
		let result = graph.swp('http://topbraid.org/teamwork#getWorkflowTemplates', {editedAsset});
		return JSON.parse(result);
	},
	
	// Generated from SWP script http://topbraid.org/teamwork#pathBetween
	
	/**
	 * Returns the shortest path between the source and target resources.
	 * @param {NamedNode} source
	 * @param {NamedNode} target
	 * @returns {Object}
	 */
	pathBetween(source, target) {
		let result = graph.swp('http://topbraid.org/teamwork#pathBetween', {source, target});
		return JSON.parse(result);
	},
	
	NS: "http://topbraid.org/teamwork#",
	PREFIX: "teamwork",
}


/**
 * Generated from the namespace <http://topbraid.org/tosh#>
 */
const tosh = {

	/**
	 * Can be used to validate a given (focus) node against a given shape, returning true if the node is valid.
	 * 
	 * If executed within a SHACL validation engine, this uses the shapes graph that was provided when the engine started.
	 * If executed in other contexts, e.g. in a stand-alone SPARQL query, the function attempts to use the URI of the current
	 * default graph as the shapes graph. This may not always be supported. If called from within an SWP engine, the
	 * shapes graph is the current query graph.
	 * @param node  The node to validate.
	 * @param shape  The shape that the node is supposed to have.
	 * @returns {boolean}
	 */
	hasShape(node, shape) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/tosh#hasShape", node, shape), null);
	},
	
	/**
	 * Checks if a given resource is supposed to be hidden in typical class displays. This applies to owl:Nothing, owl:NamedIndividual and owl:Restriction and any class that has dash:hidden true.
	 * @param resource  The node to check.
	 * @returns {boolean}
	 */
	isHiddenClass(resource) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/tosh#isHiddenClass", resource), null);
	},
	
	/**
	 * Checks whether a given node is in the target of a given shape.
	 * @param node  The node to check.
	 * @param {sh_Shape} shape  The shape that the node is supposed to be in the target of.
	 * @returns {boolean}
	 */
	isInTargetOf(node, shape) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/tosh#isInTargetOf", node, shape), null);
	},
	
	/**
	 * Checks whether a given node looks like a property shape with object-typed values. This is true for those that have a sh:class constraint or a sh:node constraint and no sh:datatype constraint.
	 * @param node  The node to check.
	 * @returns {boolean}
	 */
	isObjectPropertyShape(node) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/tosh#isObjectPropertyShape", node), null);
	},
	
	/**
	 * Checks whether a given URI represents a reified triple.
	 * @param uri  The URI to check.
	 * @returns {boolean}
	 */
	isReificationURI(uri) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/tosh#isReificationURI", uri), null);
	},
	
	/**
	 * Checks whether there are any reified values for a given triple.
	 * @param subject  The subject of the triple to reify.
	 * @param predicate  The predicate of the triple to reify.
	 * @param object  The object of the triple to reify.
	 * @returns {boolean}
	 */
	isReified(subject, predicate, object) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/tosh#isReified", subject, predicate, object), null);
	},
	
	/**
	 * Checks if a given resource is from a namespace that is marked with tosh:systemNamespace true.
	 * @param resource  The node to check.
	 * @returns {boolean}
	 */
	isSystemResource(resource) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/tosh#isSystemResource", resource), null);
	},
	
	/**
	 * Extracts the object component from a URI that represents a reified triple (for example produced by tosh:reificationURI).
	 * @param uri  The URI of the reified triple.
	 */
	reificationObject(uri) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/tosh#reificationObject", uri), null);
	},
	
	/**
	 * Extracts the predicate component from a URI that represents a reified triple (for example produced by tosh:reificationURI).
	 * @param uri  The URI of the reified triple.
	 * @returns {NamedNode}
	 */
	reificationPredicate(uri) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/tosh#reificationPredicate", uri), NamedNode);
	},
	
	/**
	 * Extracts the subject component from a URI that represents a reified triple (for example produced by tosh:reificationURI).
	 * @param uri  The URI of the reified triple.
	 * @returns {NamedNode}
	 */
	reificationSubject(uri) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/tosh#reificationSubject", uri), NamedNode);
	},
	
	/**
	 * Constructs a URI that is used to represent a reified triple. This is the inverse operation of tosh:reificationURIOf.
	 * @param subject  The subject of the triple to reify.
	 * @param predicate  The predicate of the triple to reify.
	 * @param object  The object of the triple to reify.
	 * @returns {NamedNode}
	 */
	reificationURI(subject, predicate, object) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/tosh#reificationURI", subject, predicate, object), NamedNode);
	},
	
	/**
	 * Provides direct access to a value of a reified triple, such as the timestamp.
	 * @param subject  The subject of the triple to reify.
	 * @param predicate  The predicate of the triple to reify.
	 * @param object  The object of the triple to reify.
	 * @param property  The property to get the value of, at the reified triple.
	 */
	reifiedValue(subject, predicate, object, property) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/tosh#reifiedValue", subject, predicate, object, property), null);
	},
	
	/**
	 * Gets a suitable validator for a given context, following the resolution rules from the spec.
	 * @param {sh_ConstraintComponent} component  The constraint component.
	 * @param {rdfs_Class} context  The context, e.g. sh:PropertyShape.
	 * @returns {NamedNode}
	 */
	validatorForContext(component, context) {
		return RDFNodeUtil.castValue(__jenaData.callFunction("http://topbraid.org/tosh#validatorForContext", component, context), NamedNode);
	},
	
	/**
	 * A multi-function that can be used to find all focus nodes of a given SHACL target in a given shapes graph.
	 * @param {NamedNode} target  The SHACL target definition.
	 * @param {NamedNode} shapesGraph  The URI of the shapes graph.
	 * @returns {GraphNode[]}  The focus node(s) in the target.
	 */
	targetContains(target, shapesGraph) {
		let query = 'SELECT ?focusNode WHERE { ($target $shapesGraph) <http://topbraid.org/tosh#targetContains> (?focusNode) }';
		let rs = graph.select(query, {target: target, shapesGraph: shapesGraph});
		return rs.bindings.map(b => RDFNodeUtil.castValue(b['focusNode'], null));
	},
	
	
	NS: "http://topbraid.org/tosh#",
	PREFIX: "tosh",
}


/**
 * Generated from the namespace <http://www.w3.org/2001/XMLSchema#>
 */
const xsd = {

	get ENTITY() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#ENTITY") },
	get ID() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#ID") },
	get IDREF() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#IDREF") },
	get NCName() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#NCName") },
	get NMTOKEN() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#NMTOKEN") },
	get NOTATION() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#NOTATION") },
	get Name() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#Name") },
	get QName() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#QName") },
	get anySimpleType() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#anySimpleType") },
	get anyURI() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#anyURI") },
	get base64Binary() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#base64Binary") },
	get boolean() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#boolean") },
	get byte() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#byte") },
	get date() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#date") },
	get dateTime() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#dateTime") },
	get dateTimeStamp() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#dateTimeStamp") },
	get decimal() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#decimal") },
	get double() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#double") },
	get duration() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#duration") },
	get float() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#float") },
	get gDay() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#gDay") },
	get gMonth() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#gMonth") },
	get gMonthDay() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#gMonthDay") },
	get gYear() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#gYear") },
	get gYearMonth() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#gYearMonth") },
	get hexBinary() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#hexBinary") },
	get int() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#int") },
	get integer() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#integer") },
	get language() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#language") },
	get long() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#long") },
	get negativeInteger() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#negativeInteger") },
	get nonNegativeInteger() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#nonNegativeInteger") },
	get nonPositiveInteger() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#nonPositiveInteger") },
	get normalizedString() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#normalizedString") },
	get positiveInteger() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#positiveInteger") },
	get short() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#short") },
	get string() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#string") },
	get time() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#time") },
	get token() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#token") },
	get unsignedByte() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#unsignedByte") },
	get unsignedInt() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#unsignedInt") },
	get unsignedLong() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#unsignedLong") },
	get unsignedShort() { return new rdfs_Datatype("http://www.w3.org/2001/XMLSchema#unsignedShort") },
	get fractionDigits() { return new rdf_Property("http://www.w3.org/2001/XMLSchema#fractionDigits") },
	get length() { return new rdf_Property("http://www.w3.org/2001/XMLSchema#length") },
	get maxExclusive() { return new rdf_Property("http://www.w3.org/2001/XMLSchema#maxExclusive") },
	get maxInclusive() { return new rdf_Property("http://www.w3.org/2001/XMLSchema#maxInclusive") },
	get maxLength() { return new rdf_Property("http://www.w3.org/2001/XMLSchema#maxLength") },
	get minExclusive() { return new rdf_Property("http://www.w3.org/2001/XMLSchema#minExclusive") },
	get minInclusive() { return new rdf_Property("http://www.w3.org/2001/XMLSchema#minInclusive") },
	get minLength() { return new rdf_Property("http://www.w3.org/2001/XMLSchema#minLength") },
	get pattern() { return new rdf_Property("http://www.w3.org/2001/XMLSchema#pattern") },
	get totalDigits() { return new rdf_Property("http://www.w3.org/2001/XMLSchema#totalDigits") },
	
	NS: "http://www.w3.org/2001/XMLSchema#",
	PREFIX: "xsd",
}

/**
 * Generated from the shape http://datashapes.org/dash#ConstraintReificationShape
 */
class dash_ConstraintReificationShape extends NamedNode {

	constructor(obj) {
		super(typeof obj == 'string' ? { uri: obj } : obj);
	}
	
	/**
	 * (No sh:description found)
	 * The RDF path is <http://www.w3.org/ns/shacl#message>
	 * @returns {(LiteralNode|string)[]}
	 */
	get message() {
	}
	
	set message(values) {
	}
	
	/**
	 * (No sh:description found)
	 * The RDF path is <http://www.w3.org/ns/shacl#severity>
	 * @returns {?NamedNode}
	 */
	get severity() {
	}
	
	set severity(value) {
	}
}
GraphNodeUtil.classes['dash_ConstraintReificationShape'] = dash_ConstraintReificationShape;
Object.defineProperty(dash_ConstraintReificationShape.prototype, 'message', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/ns/shacl#message>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/ns/shacl#message', values, null);
	}
});
Object.defineProperty(dash_ConstraintReificationShape.prototype, 'severity', {
	enumerable: true,
	get() {
		return this.value('<http://www.w3.org/ns/shacl#severity>', NamedNode);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://www.w3.org/ns/shacl#severity', value, null);
	}
});

/**
 * Describes the properties of instances of http://datashapes.org/dash#ConstraintReificationShape
 * @typedef dash_ConstraintReificationShape_Props_Int
 * @property {(LiteralNode|string)[]} [message]
 * @property {?NamedNode} [severity]
 * @typedef {NamedNode_Props & dash_ConstraintReificationShape_Props_Int} dash_ConstraintReificationShape_Props
 */

/**
 * Generated from the shape http://datashapes.org/graphql#Schema
 */
class graphql_Schema extends NamedNode {

	constructor(obj) {
		super(typeof obj == 'string' ? { uri: obj } : obj);
	}
	
	/**
	 * Defines the shapes that shall not be published, overriding what has been specified to be public (e.g. via graphql:publicShape).
	 * The RDF path is <http://datashapes.org/graphql#privateShape>
	 * @returns {sh_NodeShape[]}
	 */
	get privateShape() {
	}
	
	set privateShape(values) {
	}
	
	/**
	 * Links to classes so that the class and all its subclasses are published, assuming they are also node shapes. Protected classes can however not be queried from the generated root query object.
	 * The RDF path is <http://datashapes.org/graphql#protectedClass>
	 * @returns {rdfs_Class[]}
	 */
	get protectedClass() {
	}
	
	set protectedClass(values) {
	}
	
	/**
	 * Specifies the shape(s) that the GraphQL schema is publishing but not accessible from the generated root query object.
	 * The RDF path is <http://datashapes.org/graphql#protectedShape>
	 * @returns {sh_NodeShape[]}
	 */
	get protectedShape() {
	}
	
	set protectedShape(values) {
	}
	
	/**
	 * Links to classes so that the class and all its subclasses are published, assuming they are also node shapes. Also publishes any shapes linked to the class and its subclasses via sh:targetClass or dash:applicableToClass.
	 * The RDF path is <http://datashapes.org/graphql#publicClass>
	 * @returns {rdfs_Class[]}
	 */
	get publicClass() {
	}
	
	set publicClass(values) {
	}
	
	/**
	 * The namespace(s) of node shapes that shall be published by the GraphQL schema. Will use the values of sh:namespace of the linked prefix declarations.
	 * The RDF path is <http://datashapes.org/graphql#publicNamespace>
	 * @returns {NamedNode[]}
	 */
	get publicNamespace() {
	}
	
	set publicNamespace(values) {
	}
	
	/**
	 * Specifies the shape(s) that the GraphQL schema is publishing.
	 * The RDF path is <http://datashapes.org/graphql#publicShape>
	 * @returns {sh_NodeShape[]}
	 */
	get publicShape() {
	}
	
	set publicShape(values) {
	}
}
GraphNodeUtil.classes['graphql_Schema'] = graphql_Schema;
Object.defineProperty(graphql_Schema.prototype, 'privateShape', {
	enumerable: true,
	get() {
		return this.values('<http://datashapes.org/graphql#privateShape>', sh_NodeShape);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://datashapes.org/graphql#privateShape', values, null);
	}
});
Object.defineProperty(graphql_Schema.prototype, 'protectedClass', {
	enumerable: true,
	get() {
		return this.values('<http://datashapes.org/graphql#protectedClass>', rdfs_Class);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://datashapes.org/graphql#protectedClass', values, null);
	}
});
Object.defineProperty(graphql_Schema.prototype, 'protectedShape', {
	enumerable: true,
	get() {
		return this.values('<http://datashapes.org/graphql#protectedShape>', sh_NodeShape);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://datashapes.org/graphql#protectedShape', values, null);
	}
});
Object.defineProperty(graphql_Schema.prototype, 'publicClass', {
	enumerable: true,
	get() {
		return this.values('<http://datashapes.org/graphql#publicClass>', rdfs_Class);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://datashapes.org/graphql#publicClass', values, null);
	}
});
Object.defineProperty(graphql_Schema.prototype, 'publicNamespace', {
	enumerable: true,
	get() {
		return this.values('<http://datashapes.org/graphql#publicNamespace>', NamedNode);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://datashapes.org/graphql#publicNamespace', values, null);
	}
});
Object.defineProperty(graphql_Schema.prototype, 'publicShape', {
	enumerable: true,
	get() {
		return this.values('<http://datashapes.org/graphql#publicShape>', sh_NodeShape);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://datashapes.org/graphql#publicShape', values, null);
	}
});

/**
 * Describes the properties of instances of http://datashapes.org/graphql#Schema
 * @typedef graphql_Schema_Props_Int
 * @property {sh_NodeShape[]} [privateShape] - Defines the shapes that shall not be published, overriding what has been specified to be public (e.g. via graphql:publicShape).
 * @property {rdfs_Class[]} [protectedClass] - Links to classes so that the class and all its subclasses are published, assuming they are also node shapes. Protected classes can however not be queried from the generated root query object.
 * @property {sh_NodeShape[]} [protectedShape] - Specifies the shape(s) that the GraphQL schema is publishing but not accessible from the generated root query object.
 * @property {rdfs_Class[]} [publicClass] - Links to classes so that the class and all its subclasses are published, assuming they are also node shapes. Also publishes any shapes linked to the class and its subclasses via sh:targetClass or dash:applicableToClass.
 * @property {NamedNode[]} [publicNamespace] - The namespace(s) of node shapes that shall be published by the GraphQL schema. Will use the values of sh:namespace of the linked prefix declarations.
 * @property {sh_NodeShape[]} [publicShape] - Specifies the shape(s) that the GraphQL schema is publishing.
 * @typedef {NamedNode_Props & graphql_Schema_Props_Int} graphql_Schema_Props
 */

/**
 * Generated from the shape http://www.w3.org/1999/02/22-rdf-syntax-ns#Property
 */
class rdf_Property extends NamedNode {

	constructor(obj) {
		super(typeof obj == 'string' ? { uri: obj } : obj);
	}
	
	/**
	 * The comments of this, possibly in multiple languages.
	 * The RDF path is <http://www.w3.org/2000/01/rdf-schema#comment>
	 * @returns {(LiteralNode|LiteralNode|string)[]}
	 */
	get comments() {
	}
	
	set comments(values) {
	}
	
	/**
	 * The domain(s) of this property.
	 * The RDF path is <http://www.w3.org/2000/01/rdf-schema#domain>
	 * @returns {NamedNode[]}
	 */
	get domains() {
	}
	
	set domains(values) {
	}
	
	/**
	 * The display name(s) of this, possibly in multiple languages.
	 * The RDF path is <http://www.w3.org/2000/01/rdf-schema#label>
	 * @returns {(LiteralNode|string)[]}
	 */
	get labels() {
	}
	
	set labels(values) {
	}
	
	/**
	 * The range(s) of this property.
	 * The RDF path is <http://www.w3.org/2000/01/rdf-schema#range>
	 * @returns {NamedNode[]}
	 */
	get ranges() {
	}
	
	set ranges(values) {
	}
	
	/**
	 * The (direct) subproperties of this.
	 * The RDF path is ^<http://www.w3.org/2000/01/rdf-schema#subPropertyOf>
	 * @returns {rdf_Property[]}
	 */
	get subproperties() {
	}
	
	set subproperties(values) {
	}
	
	/**
	 * The (direct) superproperties of this.
	 * The RDF path is <http://www.w3.org/2000/01/rdf-schema#subPropertyOf>
	 * @returns {rdf_Property[]}
	 */
	get superproperties() {
	}
	
	set superproperties(values) {
	}
	
	/**
	 * The type(s) of this.
	 * The RDF path is <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>
	 * @returns {rdfs_Class[]}
	 */
	get types() {
	}
	
	set types(values) {
	}
}
GraphNodeUtil.classes['rdf_Property'] = rdf_Property;
Object.defineProperty(rdf_Property.prototype, 'comments', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2000/01/rdf-schema#comment>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2000/01/rdf-schema#comment', values, null);
	}
});
Object.defineProperty(rdf_Property.prototype, 'domains', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2000/01/rdf-schema#domain>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2000/01/rdf-schema#domain', values, null);
	}
});
Object.defineProperty(rdf_Property.prototype, 'labels', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2000/01/rdf-schema#label>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2000/01/rdf-schema#label', values, null);
	}
});
Object.defineProperty(rdf_Property.prototype, 'ranges', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2000/01/rdf-schema#range>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2000/01/rdf-schema#range', values, null);
	}
});
Object.defineProperty(rdf_Property.prototype, 'subproperties', {
	enumerable: true,
	get() {
		return this.values('^<http://www.w3.org/2000/01/rdf-schema#subPropertyOf>', rdf_Property);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValuesInverse' : 'setPropertyValueInverse'](this.zzzJenaNode, 'http://www.w3.org/2000/01/rdf-schema#subPropertyOf', values);
	}
});
Object.defineProperty(rdf_Property.prototype, 'superproperties', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2000/01/rdf-schema#subPropertyOf>', rdf_Property);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2000/01/rdf-schema#subPropertyOf', values, null);
	}
});
Object.defineProperty(rdf_Property.prototype, 'types', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>', rdfs_Class);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', values, null);
	}
});

/**
 * Describes the properties of instances of http://www.w3.org/1999/02/22-rdf-syntax-ns#Property
 * @typedef rdf_Property_Props_Int
 * @property {(LiteralNode|LiteralNode|string)[]} [comments] - The comments of this, possibly in multiple languages.
 * @property {NamedNode[]} [domains] - The domain(s) of this property.
 * @property {(LiteralNode|string)[]} [labels] - The display name(s) of this, possibly in multiple languages.
 * @property {NamedNode[]} [ranges] - The range(s) of this property.
 * @property {rdf_Property[]} [subproperties] - The (direct) subproperties of this.
 * @property {rdf_Property[]} [superproperties] - The (direct) superproperties of this.
 * @property {rdfs_Class[]} [types] - The type(s) of this.
 * @typedef {NamedNode_Props & rdf_Property_Props_Int} rdf_Property_Props
 */

/**
 * Generated from the shape http://www.w3.org/2000/01/rdf-schema#Class
 */
class rdfs_Class extends NamedNode {

	constructor(obj) {
		super(typeof obj == 'string' ? { uri: obj } : obj);
	}
	
	/**
	 * States whether this class is abstract, i.e. cannot have direct instances. Abstract classes are typically used to defined shared properties of its subclasses.
	 * The RDF path is <http://datashapes.org/dash#abstract>
	 * @returns {?boolean | ?LiteralNode}
	 */
	get abstract() {
	}
	
	set abstract(value) {
	}
	
	/**
	 * Used to return the default icon for all classes.
	 * The RDF path is <http://topbraid.org/tosh#classIcon>
	 * @returns {?string | ?LiteralNode}
	 */
	get classIcon() {
	}
	
	set classIcon(value) {
	}
	
	/**
	 * The comments of this, possibly in multiple languages.
	 * The RDF path is <http://www.w3.org/2000/01/rdf-schema#comment>
	 * @returns {(LiteralNode|LiteralNode|string)[]}
	 */
	get comments() {
	}
	
	set comments(values) {
	}
	
	/**
	 * The Constructor that shall be used to create new instances of this class or its subclasses.
	 * The RDF path is <http://datashapes.org/dash#constructor>
	 * @returns {?NamedNode}
	 */
	get constructorScript() {
	}
	
	set constructorScript(value) {
	}
	
	/**
	 * True if this class shall be hidden from the class hierarchies.
	 * The RDF path is <http://datashapes.org/dash#hidden>
	 * @returns {?boolean | ?LiteralNode}
	 */
	get hidden() {
	}
	
	set hidden(value) {
	}
	
	/**
	 * Returns all property shapes that have been declared at "super-shapes" (via sh:node) or "superclasses" (via rdfs:subClassOf), including the indirect supers, recursively.
	 * The RDF path is <http://topbraid.org/tosh#inheritedProperty>
	 * @returns {NamedNode[]}
	 */
	get inheritedProperty() {
	}
	
	/**
	 * The display name(s) of this, possibly in multiple languages.
	 * The RDF path is <http://www.w3.org/2000/01/rdf-schema#label>
	 * @returns {(LiteralNode|string)[]}
	 */
	get labels() {
	}
	
	set labels(values) {
	}
	
	/**
	 * The properties declared for this, using SHACL property shapes.
	 * The RDF path is <http://www.w3.org/ns/shacl#property>
	 * @returns {sh_PropertyShape[]}
	 */
	get properties() {
	}
	
	set properties(values) {
	}
	
	/**
	 * The Resource Actions that can be applied to instances of this class.
	 * The RDF path is <http://datashapes.org/dash#resourceAction>
	 * @returns {NamedNode[]}
	 */
	get resourceActions() {
	}
	
	set resourceActions(values) {
	}
	
	/**
	 * The Services that can be applied to instances of this class (as focusNode).
	 * The RDF path is <http://datashapes.org/dash#resourceService>
	 * @returns {NamedNode[]}
	 */
	get resourceServices() {
	}
	
	set resourceServices(values) {
	}
	
	/**
	 * The (direct) subclasses of this class.
	 * The RDF path is ^<http://www.w3.org/2000/01/rdf-schema#subClassOf>
	 * @returns {rdfs_Class[]}
	 */
	get subclasses() {
	}
	
	set subclasses(values) {
	}
	
	/**
	 * The (direct) parent classes of this class.
	 * The RDF path is <http://www.w3.org/2000/01/rdf-schema#subClassOf>
	 * @returns {rdfs_Class[]}
	 */
	get superclasses() {
	}
	
	set superclasses(values) {
	}
	
	/**
	 * The type(s) of this.
	 * The RDF path is <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>
	 * @returns {rdfs_Class[]}
	 */
	get types() {
	}
	
	set types(values) {
	}
	
	// Shape script injected from http://topbraid.org/tosh#Class-ShapeScript


    /**
     * Returns this class as an instance of sh:NodeShape.
     * @returns {sh_NodeShape}
     */
    asNodeShape() {
		return sh.asNodeShape(this);
	}

    /**
     * @callback rdfs_Class_callback
     * @param {rdfs_Class} class  the visited class
     */

    /**
     * Performs a depth-first traversal this class and its superclasses, visiting each (super) class
     * once until the callback function returns a non-null/undefined result. This becomes the result of this function.
     * The order in which sibling classes are traversed is undefined, so results may be inconsistent in
     * multiple-inheritance scenarios.
     * @param {rdfs_Class_callback} callback  the callback for each class
     * @param {Set} [reached]  the Set of reached URI strings, used internally
     * @returns the return value of the first callback that returned any value
     */
    walkSuperclasses(callback, reached) {
        if(!reached) {
            reached = new Set();
        }
        if(!reached.has(this.uri)) {
            reached.add(this.uri);
            let result = callback(this);
            if(result !== undefined && result !== null) {
                return result;
            }
            let supers = this.superclasses;
            for(let i = 0; i < supers.length; i++) {
                result = supers[i].walkSuperclasses(callback, reached);
                if(result !== undefined && result !== null) {
                    return result;
                }
            }
        }
    }

}
GraphNodeUtil.classes['rdfs_Class'] = rdfs_Class;
Object.defineProperty(rdfs_Class.prototype, 'abstract', {
	enumerable: true,
	get() {
		return this.value('<http://datashapes.org/dash#abstract>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://datashapes.org/dash#abstract', value, 'http://www.w3.org/2001/XMLSchema#boolean');
	}
});
Object.defineProperty(rdfs_Class.prototype, 'classIcon', {
	enumerable: true,
	get() {
		return this.value('<http://topbraid.org/tosh#classIcon>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://topbraid.org/tosh#classIcon', value, 'http://www.w3.org/2001/XMLSchema#string');
	}
});
Object.defineProperty(rdfs_Class.prototype, 'comments', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2000/01/rdf-schema#comment>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2000/01/rdf-schema#comment', values, null);
	}
});
Object.defineProperty(rdfs_Class.prototype, 'constructorScript', {
	enumerable: true,
	get() {
		return this.value('<http://datashapes.org/dash#constructor>', NamedNode);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://datashapes.org/dash#constructor', value, null);
	}
});
Object.defineProperty(rdfs_Class.prototype, 'hidden', {
	enumerable: true,
	get() {
		return this.value('<http://datashapes.org/dash#hidden>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://datashapes.org/dash#hidden', value, 'http://www.w3.org/2001/XMLSchema#boolean');
	}
});
Object.defineProperty(rdfs_Class.prototype, 'inheritedProperty', {
	enumerable: true,
	get() {
		return this.values('<http://topbraid.org/tosh#inheritedProperty>', null);
	},
});
Object.defineProperty(rdfs_Class.prototype, 'labels', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2000/01/rdf-schema#label>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2000/01/rdf-schema#label', values, null);
	}
});
Object.defineProperty(rdfs_Class.prototype, 'properties', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/ns/shacl#property>', sh_PropertyShape);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/ns/shacl#property', values, null);
	}
});
Object.defineProperty(rdfs_Class.prototype, 'resourceActions', {
	enumerable: true,
	get() {
		return this.values('<http://datashapes.org/dash#resourceAction>', NamedNode);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://datashapes.org/dash#resourceAction', values, null);
	}
});
Object.defineProperty(rdfs_Class.prototype, 'resourceServices', {
	enumerable: true,
	get() {
		return this.values('<http://datashapes.org/dash#resourceService>', NamedNode);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://datashapes.org/dash#resourceService', values, null);
	}
});
Object.defineProperty(rdfs_Class.prototype, 'subclasses', {
	enumerable: true,
	get() {
		return this.values('^<http://www.w3.org/2000/01/rdf-schema#subClassOf>', rdfs_Class);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValuesInverse' : 'setPropertyValueInverse'](this.zzzJenaNode, 'http://www.w3.org/2000/01/rdf-schema#subClassOf', values);
	}
});
Object.defineProperty(rdfs_Class.prototype, 'superclasses', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2000/01/rdf-schema#subClassOf>', rdfs_Class);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2000/01/rdf-schema#subClassOf', values, null);
	}
});
Object.defineProperty(rdfs_Class.prototype, 'types', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>', rdfs_Class);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', values, null);
	}
});

/**
 * Describes the properties of instances of http://www.w3.org/2000/01/rdf-schema#Class
 * @typedef rdfs_Class_Props_Int
 * @property {?boolean | ?LiteralNode} [abstract] - States whether this class is abstract, i.e. cannot have direct instances. Abstract classes are typically used to defined shared properties of its subclasses.
 * @property {?string | ?LiteralNode} [classIcon] - Used to return the default icon for all classes.
 * @property {(LiteralNode|LiteralNode|string)[]} [comments] - The comments of this, possibly in multiple languages.
 * @property {?NamedNode} [constructorScript] - The Constructor that shall be used to create new instances of this class or its subclasses.
 * @property {?boolean | ?LiteralNode} [hidden] - True if this class shall be hidden from the class hierarchies.
 * @property {(LiteralNode|string)[]} [labels] - The display name(s) of this, possibly in multiple languages.
 * @property {sh_PropertyShape[]} [properties] - The properties declared for this, using SHACL property shapes.
 * @property {NamedNode[]} [resourceActions] - The Resource Actions that can be applied to instances of this class.
 * @property {NamedNode[]} [resourceServices] - The Services that can be applied to instances of this class (as focusNode).
 * @property {rdfs_Class[]} [subclasses] - The (direct) subclasses of this class.
 * @property {rdfs_Class[]} [superclasses] - The (direct) parent classes of this class.
 * @property {rdfs_Class[]} [types] - The type(s) of this.
 * @typedef {NamedNode_Props & rdfs_Class_Props_Int} rdfs_Class_Props
 */

/**
 * Generated from the shape http://www.w3.org/ns/shacl#Parameterizable
 */
class sh_Parameterizable extends NamedNode {

	constructor(obj) {
		super(typeof obj == 'string' ? { uri: obj } : obj);
	}
	
	/**
	 * The comments of this, possibly in multiple languages.
	 * The RDF path is <http://www.w3.org/2000/01/rdf-schema#comment>
	 * @returns {(LiteralNode|LiteralNode|string)[]}
	 */
	get comments() {
	}
	
	set comments(values) {
	}
	
	/**
	 * The display name(s) of this, possibly in multiple languages.
	 * The RDF path is <http://www.w3.org/2000/01/rdf-schema#label>
	 * @returns {(LiteralNode|string)[]}
	 */
	get labels() {
	}
	
	set labels(values) {
	}
	
	/**
	 * The input parameters.
	 * The RDF path is <http://www.w3.org/ns/shacl#parameter>
	 * @returns {sh_Parameter[]}
	 */
	get parameter() {
	}
	
	set parameter(values) {
	}
	
	/**
	 * The type(s) of this.
	 * The RDF path is <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>
	 * @returns {rdfs_Class[]}
	 */
	get types() {
	}
	
	set types(values) {
	}
}
GraphNodeUtil.classes['sh_Parameterizable'] = sh_Parameterizable;
Object.defineProperty(sh_Parameterizable.prototype, 'comments', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2000/01/rdf-schema#comment>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2000/01/rdf-schema#comment', values, null);
	}
});
Object.defineProperty(sh_Parameterizable.prototype, 'labels', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2000/01/rdf-schema#label>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2000/01/rdf-schema#label', values, null);
	}
});
Object.defineProperty(sh_Parameterizable.prototype, 'parameter', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/ns/shacl#parameter>', sh_Parameter);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/ns/shacl#parameter', values, null);
	}
});
Object.defineProperty(sh_Parameterizable.prototype, 'types', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>', rdfs_Class);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', values, null);
	}
});

/**
 * Describes the properties of instances of http://www.w3.org/ns/shacl#Parameterizable
 * @typedef sh_Parameterizable_Props_Int
 * @property {(LiteralNode|LiteralNode|string)[]} [comments] - The comments of this, possibly in multiple languages.
 * @property {(LiteralNode|string)[]} [labels] - The display name(s) of this, possibly in multiple languages.
 * @property {sh_Parameter[]} [parameter] - The input parameters.
 * @property {rdfs_Class[]} [types] - The type(s) of this.
 * @typedef {NamedNode_Props & sh_Parameterizable_Props_Int} sh_Parameterizable_Props
 */

/**
 * Generated from the shape http://www.w3.org/ns/shacl#PropertyGroup
 */
class sh_PropertyGroup extends NamedNode {

	constructor(obj) {
		super(typeof obj == 'string' ? { uri: obj } : obj);
	}
	
	/**
	 * The comments of this, possibly in multiple languages.
	 * The RDF path is <http://www.w3.org/2000/01/rdf-schema#comment>
	 * @returns {(LiteralNode|LiteralNode|string)[]}
	 */
	get comments() {
	}
	
	set comments(values) {
	}
	
	/**
	 * The display name(s) of this, possibly in multiple languages.
	 * The RDF path is <http://www.w3.org/2000/01/rdf-schema#label>
	 * @returns {(LiteralNode|string)[]}
	 */
	get labels() {
	}
	
	set labels(values) {
	}
	
	/**
	 * The relative order of this group compared to others.
	 * The RDF path is <http://www.w3.org/ns/shacl#order>
	 * @returns {?number | ?LiteralNode}
	 */
	get order() {
	}
	
	set order(value) {
	}
	
	/**
	 * Used to return the (default) icon for property groups.
	 * The RDF path is <http://topbraid.org/tosh#propertyGroupIcon>
	 * @returns {?string | ?LiteralNode}
	 */
	get propertyGroupIcon() {
	}
	
	set propertyGroupIcon(value) {
	}
}
GraphNodeUtil.classes['sh_PropertyGroup'] = sh_PropertyGroup;
Object.defineProperty(sh_PropertyGroup.prototype, 'comments', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2000/01/rdf-schema#comment>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2000/01/rdf-schema#comment', values, null);
	}
});
Object.defineProperty(sh_PropertyGroup.prototype, 'labels', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2000/01/rdf-schema#label>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2000/01/rdf-schema#label', values, null);
	}
});
Object.defineProperty(sh_PropertyGroup.prototype, 'order', {
	enumerable: true,
	get() {
		return this.value('<http://www.w3.org/ns/shacl#order>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://www.w3.org/ns/shacl#order', value, null);
	}
});
Object.defineProperty(sh_PropertyGroup.prototype, 'propertyGroupIcon', {
	enumerable: true,
	get() {
		return this.value('<http://topbraid.org/tosh#propertyGroupIcon>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://topbraid.org/tosh#propertyGroupIcon', value, 'http://www.w3.org/2001/XMLSchema#string');
	}
});

/**
 * Describes the properties of instances of http://www.w3.org/ns/shacl#PropertyGroup
 * @typedef sh_PropertyGroup_Props_Int
 * @property {(LiteralNode|LiteralNode|string)[]} [comments] - The comments of this, possibly in multiple languages.
 * @property {(LiteralNode|string)[]} [labels] - The display name(s) of this, possibly in multiple languages.
 * @property {?number | ?LiteralNode} [order] - The relative order of this group compared to others.
 * @property {?string | ?LiteralNode} [propertyGroupIcon] - Used to return the (default) icon for property groups.
 * @typedef {NamedNode_Props & sh_PropertyGroup_Props_Int} sh_PropertyGroup_Props
 */

/**
 * Generated from the shape http://www.w3.org/ns/shacl#Rule
 */
class sh_Rule extends NamedNode {

	constructor(obj) {
		super(typeof obj == 'string' ? { uri: obj } : obj);
	}
	
	/**
	 * The comments of this, possibly in multiple languages.
	 * The RDF path is <http://www.w3.org/2000/01/rdf-schema#comment>
	 * @returns {(LiteralNode|LiteralNode|string)[]}
	 */
	get comments() {
	}
	
	set comments(values) {
	}
	
	/**
	 * The pre-conditions that must apply before a rule gets executed. The focus node must conform to all conditions, which must be shapes.
	 * The RDF path is <http://www.w3.org/ns/shacl#condition>
	 * @returns {NamedNode[]}
	 */
	get condition() {
	}
	
	set condition(values) {
	}
	
	/**
	 * True to deactivate the rule so that it will not get executed.
	 * The RDF path is <http://www.w3.org/ns/shacl#deactivated>
	 * @returns {?boolean | ?LiteralNode}
	 */
	get deactivated() {
	}
	
	set deactivated(value) {
	}
	
	/**
	 * The display name(s) of this, possibly in multiple languages.
	 * The RDF path is <http://www.w3.org/2000/01/rdf-schema#label>
	 * @returns {(LiteralNode|string)[]}
	 */
	get labels() {
	}
	
	set labels(values) {
	}
	
	/**
	 * The order of this rule relative to other rules at the same shape. Rules with lower order are executed first. Default value is 0. Rules with the same order cannot "see" each other's inferences.
	 * The RDF path is <http://www.w3.org/ns/shacl#order>
	 * @returns {?number | ?LiteralNode}
	 */
	get order() {
	}
	
	set order(value) {
	}
	
	/**
	 * The shapes or classes that the rule is attached to.
	 * The RDF path is ^<http://www.w3.org/ns/shacl#rule>
	 * @returns {sh_Shape[]}
	 */
	get ruleInverse() {
	}
	
	set ruleInverse(values) {
	}
	
	/**
	 * The type(s) of this.
	 * The RDF path is <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>
	 * @returns {rdfs_Class[]}
	 */
	get types() {
	}
	
	set types(values) {
	}
}
GraphNodeUtil.classes['sh_Rule'] = sh_Rule;
Object.defineProperty(sh_Rule.prototype, 'comments', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2000/01/rdf-schema#comment>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2000/01/rdf-schema#comment', values, null);
	}
});
Object.defineProperty(sh_Rule.prototype, 'condition', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/ns/shacl#condition>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/ns/shacl#condition', values, null);
	}
});
Object.defineProperty(sh_Rule.prototype, 'deactivated', {
	enumerable: true,
	get() {
		return this.value('<http://www.w3.org/ns/shacl#deactivated>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://www.w3.org/ns/shacl#deactivated', value, 'http://www.w3.org/2001/XMLSchema#boolean');
	}
});
Object.defineProperty(sh_Rule.prototype, 'labels', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2000/01/rdf-schema#label>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2000/01/rdf-schema#label', values, null);
	}
});
Object.defineProperty(sh_Rule.prototype, 'order', {
	enumerable: true,
	get() {
		return this.value('<http://www.w3.org/ns/shacl#order>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://www.w3.org/ns/shacl#order', value, null);
	}
});
Object.defineProperty(sh_Rule.prototype, 'ruleInverse', {
	enumerable: true,
	get() {
		return this.values('^<http://www.w3.org/ns/shacl#rule>', sh_Shape);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValuesInverse' : 'setPropertyValueInverse'](this.zzzJenaNode, 'http://www.w3.org/ns/shacl#rule', values);
	}
});
Object.defineProperty(sh_Rule.prototype, 'types', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>', rdfs_Class);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', values, null);
	}
});

/**
 * Describes the properties of instances of http://www.w3.org/ns/shacl#Rule
 * @typedef sh_Rule_Props_Int
 * @property {(LiteralNode|LiteralNode|string)[]} [comments] - The comments of this, possibly in multiple languages.
 * @property {NamedNode[]} [condition] - The pre-conditions that must apply before a rule gets executed. The focus node must conform to all conditions, which must be shapes.
 * @property {?boolean | ?LiteralNode} [deactivated] - True to deactivate the rule so that it will not get executed.
 * @property {(LiteralNode|string)[]} [labels] - The display name(s) of this, possibly in multiple languages.
 * @property {?number | ?LiteralNode} [order] - The order of this rule relative to other rules at the same shape. Rules with lower order are executed first. Default value is 0. Rules with the same order cannot "see" each other's inferences.
 * @property {sh_Shape[]} [ruleInverse] - The shapes or classes that the rule is attached to.
 * @property {rdfs_Class[]} [types] - The type(s) of this.
 * @typedef {NamedNode_Props & sh_Rule_Props_Int} sh_Rule_Props
 */

/**
 * Generated from the shape http://www.w3.org/ns/shacl#Shape
 */
class sh_Shape extends NamedNode {

	constructor(obj) {
		super(typeof obj == 'string' ? { uri: obj } : obj);
	}
	
	/**
	 * True to deactivate this shape, making it literally invisible and without any effect.
	 * The RDF path is <http://www.w3.org/ns/shacl#deactivated>
	 * @returns {?boolean | ?LiteralNode}
	 */
	get deactivated() {
	}
	
	set deactivated(value) {
	}
}
GraphNodeUtil.classes['sh_Shape'] = sh_Shape;
Object.defineProperty(sh_Shape.prototype, 'deactivated', {
	enumerable: true,
	get() {
		return this.value('<http://www.w3.org/ns/shacl#deactivated>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://www.w3.org/ns/shacl#deactivated', value, 'http://www.w3.org/2001/XMLSchema#boolean');
	}
});

/**
 * Describes the properties of instances of http://www.w3.org/ns/shacl#Shape
 * @typedef sh_Shape_Props_Int
 * @property {?boolean | ?LiteralNode} [deactivated] - True to deactivate this shape, making it literally invisible and without any effect.
 * @typedef {NamedNode_Props & sh_Shape_Props_Int} sh_Shape_Props
 */

/**
 * Generated from the shape http://www.w3.org/2004/02/skos/core#Collection
 */
class skos_Collection extends NamedNode {

	constructor(obj) {
		super(typeof obj == 'string' ? { uri: obj } : obj);
	}
	
	/**
	 * Descriptions or definitions of the collection.
	 * The RDF path is <http://www.w3.org/2000/01/rdf-schema#comment>
	 * @returns {(LiteralNode|LiteralNode|string)[]}
	 */
	get comment() {
	}
	
	set comment(values) {
	}
	
	/**
	 * The display label(s) of the collection.
	 * The RDF path is <http://www.w3.org/2000/01/rdf-schema#label>
	 * @returns {(LiteralNode|string)[]}
	 */
	get label() {
	}
	
	set label(values) {
	}
	
	/**
	 * Relates a collection to its members, which should be either Concepts or other Collections.
	 * The RDF path is <http://www.w3.org/2004/02/skos/core#member>
	 * @returns {NamedNode[]}
	 */
	get member() {
	}
	
	set member(values) {
	}
	
	/**
	 * The type(s) of this.
	 * The RDF path is <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>
	 * @returns {rdfs_Class[]}
	 */
	get types() {
	}
	
	set types(values) {
	}
}
GraphNodeUtil.classes['skos_Collection'] = skos_Collection;
Object.defineProperty(skos_Collection.prototype, 'comment', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2000/01/rdf-schema#comment>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2000/01/rdf-schema#comment', values, null);
	}
});
Object.defineProperty(skos_Collection.prototype, 'label', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2000/01/rdf-schema#label>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2000/01/rdf-schema#label', values, null);
	}
});
Object.defineProperty(skos_Collection.prototype, 'member', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2004/02/skos/core#member>', NamedNode);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2004/02/skos/core#member', values, null);
	}
});
Object.defineProperty(skos_Collection.prototype, 'types', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>', rdfs_Class);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', values, null);
	}
});

/**
 * Describes the properties of instances of http://www.w3.org/2004/02/skos/core#Collection
 * @typedef skos_Collection_Props_Int
 * @property {(LiteralNode|LiteralNode|string)[]} [comment] - Descriptions or definitions of the collection.
 * @property {(LiteralNode|string)[]} [label] - The display label(s) of the collection.
 * @property {NamedNode[]} [member] - Relates a collection to its members, which should be either Concepts or other Collections.
 * @property {rdfs_Class[]} [types] - The type(s) of this.
 * @typedef {NamedNode_Props & skos_Collection_Props_Int} skos_Collection_Props
 */

/**
 * Generated from the shape http://www.w3.org/2004/02/skos/core#Concept
 */
class skos_Concept extends NamedNode {

	constructor(obj) {
		super(typeof obj == 'string' ? { uri: obj } : obj);
	}
	
	/**
	 * An alternative lexical label for a resource.
	 * The RDF path is <http://www.w3.org/2004/02/skos/core#altLabel>
	 * @returns {(LiteralNode|string)[]}
	 */
	get altLabel() {
	}
	
	set altLabel(values) {
	}
	
	/**
	 * Associates an skosxl:Label with a skos:Concept. The property is analogous to skos:altLabel.
	 * The RDF path is <http://www.w3.org/2008/05/skos-xl#altLabel>
	 * @returns {skosxl_Label[]}
	 */
	get altLabelXL() {
	}
	
	set altLabelXL(values) {
	}
	
	/**
	 * Used to state a hierarchical mapping link between two conceptual resources in different concept schemes.
	 * The RDF path is <http://www.w3.org/2004/02/skos/core#broadMatch>
	 * @returns {skos_Concept[]}
	 */
	get broadMatch() {
	}
	
	set broadMatch(values) {
	}
	
	/**
	 * Relates a concept to a concept that is more general in meaning.
	 * The RDF path is <http://www.w3.org/2004/02/skos/core#broader>
	 * @returns {skos_Concept[]}
	 */
	get broader() {
	}
	
	set broader(values) {
	}
	
	/**
	 * A note about a modification to a concept.
	 * The RDF path is <http://www.w3.org/2004/02/skos/core#changeNote>
	 * @returns {(LiteralNode|LiteralNode|string)[]}
	 */
	get changeNote() {
	}
	
	set changeNote(values) {
	}
	
	/**
	 * Used to link two concepts that are sufficiently similar that they can be used interchangeably in some information retrieval applications. In order to avoid the possibility of "compound errors" when combining mappings across more than two concept schemes, skos:closeMatch is not declared to be a transitive property.
	 * The RDF path is <http://www.w3.org/2004/02/skos/core#closeMatch>
	 * @returns {skos_Concept[]}
	 */
	get closeMatch() {
	}
	
	set closeMatch(values) {
	}
	
	/**
	 * Used to return the (default) icon for SKOS concepts.
	 * The RDF path is <http://topbraid.org/skos.shapes#conceptIcon>
	 * @returns {?string | ?LiteralNode}
	 */
	get conceptIcon() {
	}
	
	set conceptIcon(value) {
	}
	
	/**
	 * A statement or formal explanation of the meaning of a concept.
	 * The RDF path is <http://www.w3.org/2004/02/skos/core#definition>
	 * @returns {(LiteralNode|LiteralNode|string)[]}
	 */
	get definition() {
	}
	
	set definition(values) {
	}
	
	/**
	 * A note for an editor, translator or maintainer of the vocabulary.
	 * The RDF path is <http://www.w3.org/2004/02/skos/core#editorialNote>
	 * @returns {(LiteralNode|LiteralNode|string)[]}
	 */
	get editorialNote() {
	}
	
	set editorialNote(values) {
	}
	
	/**
	 * Used to link two concepts, indicating a high degree of confidence that the concepts can be used interchangeably across a wide range of information retrieval applications. skos:exactMatch is a transitive property, and is a sub-property of skos:closeMatch.
	 * The RDF path is <http://www.w3.org/2004/02/skos/core#exactMatch>
	 * @returns {skos_Concept[]}
	 */
	get exactMatch() {
	}
	
	set exactMatch(values) {
	}
	
	/**
	 * An example of the use of a concept.
	 * The RDF path is <http://www.w3.org/2004/02/skos/core#example>
	 * @returns {(LiteralNode|LiteralNode|string)[]}
	 */
	get example() {
	}
	
	set example(values) {
	}
	
	/**
	 * True to hide this concept from Taxonomy hierarchies displays.
	 * The RDF path is <http://datashapes.org/dash#hidden>
	 * @returns {?boolean | ?LiteralNode}
	 */
	get hidden() {
	}
	
	set hidden(value) {
	}
	
	/**
	 * A lexical label for a resource that should be hidden when generating visual displays of the resource, but should still be accessible to free text search operations.
	 * The RDF path is <http://www.w3.org/2004/02/skos/core#hiddenLabel>
	 * @returns {(LiteralNode|string)[]}
	 */
	get hiddenLabel() {
	}
	
	set hiddenLabel(values) {
	}
	
	/**
	 * Associates an skosxl:Label with a skos:Concept. The property is analogous to skos:hiddenLabel.
	 * The RDF path is <http://www.w3.org/2008/05/skos-xl#hiddenLabel>
	 * @returns {skosxl_Label[]}
	 */
	get hiddenLabelXL() {
	}
	
	set hiddenLabelXL(values) {
	}
	
	/**
	 * A note about the past state/use/meaning of a concept.
	 * The RDF path is <http://www.w3.org/2004/02/skos/core#historyNote>
	 * @returns {(LiteralNode|LiteralNode|string)[]}
	 */
	get historyNote() {
	}
	
	set historyNote(values) {
	}
	
	/**
	 * Relates a concept to a concept that is more specific in meaning.
	 * The RDF path is ^<http://www.w3.org/2004/02/skos/core#broader>
	 * @returns {skos_Concept[]}
	 */
	get narrower() {
	}
	
	set narrower(values) {
	}
	
	/**
	 * A notation, also known as classification code, is a string of characters such as "T58.5" or "303.4833" used to uniquely identify a concept within the scope of a given concept scheme.
	 * The RDF path is <http://www.w3.org/2004/02/skos/core#notation>
	 * @returns {(boolean|number|string|LiteralNode|NamedNode)[]}
	 */
	get notation() {
	}
	
	set notation(values) {
	}
	
	/**
	 * A general note, for any purpose.
	 * The RDF path is <http://www.w3.org/2004/02/skos/core#note>
	 * @returns {(LiteralNode|LiteralNode|string)[]}
	 */
	get note() {
	}
	
	set note(values) {
	}
	
	/**
	 * The preferred lexical label for a resource, in a given language.
	 * The RDF path is <http://www.w3.org/2004/02/skos/core#prefLabel>
	 * @returns {(LiteralNode|string)[]}
	 */
	get prefLabel() {
	}
	
	set prefLabel(values) {
	}
	
	/**
	 * (No sh:description found)
	 * The RDF path is <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>
	 * @returns {rdfs_Class[]}
	 */
	get rdf_type() {
	}
	
	set rdf_type(values) {
	}
	
	/**
	 * Relates a concept to a concept with which there is an associative semantic relationship.
	 * The RDF path is <http://www.w3.org/2004/02/skos/core#related>
	 * @returns {skos_Concept[]}
	 */
	get related() {
	}
	
	set related(values) {
	}
	
	/**
	 * Used to state an associative mapping link between two conceptual resources in different concept schemes.
	 * The RDF path is <http://www.w3.org/2004/02/skos/core#relatedMatch>
	 * @returns {skos_Concept[]}
	 */
	get relatedMatch() {
	}
	
	set relatedMatch(values) {
	}
	
	/**
	 * A note that helps to clarify the meaning and/or the use of a concept.
	 * The RDF path is <http://www.w3.org/2004/02/skos/core#scopeNote>
	 * @returns {(LiteralNode|LiteralNode|string)[]}
	 */
	get scopeNote() {
	}
	
	set scopeNote(values) {
	}
	
	/**
	 * (No sh:description found)
	 * The RDF path is ^<http://www.w3.org/2004/02/skos/core#hasTopConcept>
	 * @returns {skos_ConceptScheme[]}
	 */
	get topConceptOf() {
	}
	
	set topConceptOf(values) {
	}
	
	/**
	 * This constraint defines the "broader concept" relationship as asymmetric, that is, no concept can have itself as a broader concept, either directly or transitively. This constraint is EDG-specific and not mandated by the SKOS standard.
	 * The RDF path is (<http://www.w3.org/2004/02/skos/core#broader>)+
	 * @returns {(boolean|number|string|LiteralNode|NamedNode)[]}
	 */
	get unnamedPathProperty() {
	}
}
GraphNodeUtil.classes['skos_Concept'] = skos_Concept;
Object.defineProperty(skos_Concept.prototype, 'altLabel', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2004/02/skos/core#altLabel>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2004/02/skos/core#altLabel', values, null);
	}
});
Object.defineProperty(skos_Concept.prototype, 'altLabelXL', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2008/05/skos-xl#altLabel>', skosxl_Label);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2008/05/skos-xl#altLabel', values, null);
	}
});
Object.defineProperty(skos_Concept.prototype, 'broadMatch', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2004/02/skos/core#broadMatch>', skos_Concept);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2004/02/skos/core#broadMatch', values, null);
	}
});
Object.defineProperty(skos_Concept.prototype, 'broader', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2004/02/skos/core#broader>', skos_Concept);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2004/02/skos/core#broader', values, null);
	}
});
Object.defineProperty(skos_Concept.prototype, 'changeNote', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2004/02/skos/core#changeNote>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2004/02/skos/core#changeNote', values, null);
	}
});
Object.defineProperty(skos_Concept.prototype, 'closeMatch', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2004/02/skos/core#closeMatch>', skos_Concept);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2004/02/skos/core#closeMatch', values, null);
	}
});
Object.defineProperty(skos_Concept.prototype, 'conceptIcon', {
	enumerable: true,
	get() {
		return this.value('<http://topbraid.org/skos.shapes#conceptIcon>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://topbraid.org/skos.shapes#conceptIcon', value, 'http://www.w3.org/2001/XMLSchema#string');
	}
});
Object.defineProperty(skos_Concept.prototype, 'definition', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2004/02/skos/core#definition>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2004/02/skos/core#definition', values, null);
	}
});
Object.defineProperty(skos_Concept.prototype, 'editorialNote', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2004/02/skos/core#editorialNote>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2004/02/skos/core#editorialNote', values, null);
	}
});
Object.defineProperty(skos_Concept.prototype, 'exactMatch', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2004/02/skos/core#exactMatch>', skos_Concept);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2004/02/skos/core#exactMatch', values, null);
	}
});
Object.defineProperty(skos_Concept.prototype, 'example', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2004/02/skos/core#example>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2004/02/skos/core#example', values, null);
	}
});
Object.defineProperty(skos_Concept.prototype, 'hidden', {
	enumerable: true,
	get() {
		return this.value('<http://datashapes.org/dash#hidden>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://datashapes.org/dash#hidden', value, 'http://www.w3.org/2001/XMLSchema#boolean');
	}
});
Object.defineProperty(skos_Concept.prototype, 'hiddenLabel', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2004/02/skos/core#hiddenLabel>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2004/02/skos/core#hiddenLabel', values, null);
	}
});
Object.defineProperty(skos_Concept.prototype, 'hiddenLabelXL', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2008/05/skos-xl#hiddenLabel>', skosxl_Label);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2008/05/skos-xl#hiddenLabel', values, null);
	}
});
Object.defineProperty(skos_Concept.prototype, 'historyNote', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2004/02/skos/core#historyNote>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2004/02/skos/core#historyNote', values, null);
	}
});
Object.defineProperty(skos_Concept.prototype, 'narrower', {
	enumerable: true,
	get() {
		return this.values('^<http://www.w3.org/2004/02/skos/core#broader>', skos_Concept);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValuesInverse' : 'setPropertyValueInverse'](this.zzzJenaNode, 'http://www.w3.org/2004/02/skos/core#broader', values);
	}
});
Object.defineProperty(skos_Concept.prototype, 'notation', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2004/02/skos/core#notation>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2004/02/skos/core#notation', values, null);
	}
});
Object.defineProperty(skos_Concept.prototype, 'note', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2004/02/skos/core#note>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2004/02/skos/core#note', values, null);
	}
});
Object.defineProperty(skos_Concept.prototype, 'prefLabel', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2004/02/skos/core#prefLabel>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2004/02/skos/core#prefLabel', values, null);
	}
});
Object.defineProperty(skos_Concept.prototype, 'rdf_type', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>', rdfs_Class);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', values, null);
	}
});
Object.defineProperty(skos_Concept.prototype, 'related', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2004/02/skos/core#related>', skos_Concept);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2004/02/skos/core#related', values, null);
	}
});
Object.defineProperty(skos_Concept.prototype, 'relatedMatch', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2004/02/skos/core#relatedMatch>', skos_Concept);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2004/02/skos/core#relatedMatch', values, null);
	}
});
Object.defineProperty(skos_Concept.prototype, 'scopeNote', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2004/02/skos/core#scopeNote>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2004/02/skos/core#scopeNote', values, null);
	}
});
Object.defineProperty(skos_Concept.prototype, 'topConceptOf', {
	enumerable: true,
	get() {
		return this.values('^<http://www.w3.org/2004/02/skos/core#hasTopConcept>', skos_ConceptScheme);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValuesInverse' : 'setPropertyValueInverse'](this.zzzJenaNode, 'http://www.w3.org/2004/02/skos/core#hasTopConcept', values);
	}
});
Object.defineProperty(skos_Concept.prototype, 'unnamedPathProperty', {
	enumerable: true,
	get() {
		return this.values('(<http://www.w3.org/2004/02/skos/core#broader>)+', null);
	},
});

/**
 * Describes the properties of instances of http://www.w3.org/2004/02/skos/core#Concept
 * @typedef skos_Concept_Props_Int
 * @property {(LiteralNode|string)[]} [altLabel] - An alternative lexical label for a resource.
 * @property {skosxl_Label[]} [altLabelXL] - Associates an skosxl:Label with a skos:Concept. The property is analogous to skos:altLabel.
 * @property {skos_Concept[]} [broadMatch] - Used to state a hierarchical mapping link between two conceptual resources in different concept schemes.
 * @property {skos_Concept[]} [broader] - Relates a concept to a concept that is more general in meaning.
 * @property {(LiteralNode|LiteralNode|string)[]} [changeNote] - A note about a modification to a concept.
 * @property {skos_Concept[]} [closeMatch] - Used to link two concepts that are sufficiently similar that they can be used interchangeably in some information retrieval applications. In order to avoid the possibility of "compound errors" when combining mappings across more than two concept schemes, skos:closeMatch is not declared to be a transitive property.
 * @property {?string | ?LiteralNode} [conceptIcon] - Used to return the (default) icon for SKOS concepts.
 * @property {(LiteralNode|LiteralNode|string)[]} [definition] - A statement or formal explanation of the meaning of a concept.
 * @property {(LiteralNode|LiteralNode|string)[]} [editorialNote] - A note for an editor, translator or maintainer of the vocabulary.
 * @property {skos_Concept[]} [exactMatch] - Used to link two concepts, indicating a high degree of confidence that the concepts can be used interchangeably across a wide range of information retrieval applications. skos:exactMatch is a transitive property, and is a sub-property of skos:closeMatch.
 * @property {(LiteralNode|LiteralNode|string)[]} [example] - An example of the use of a concept.
 * @property {?boolean | ?LiteralNode} [hidden] - True to hide this concept from Taxonomy hierarchies displays.
 * @property {(LiteralNode|string)[]} [hiddenLabel] - A lexical label for a resource that should be hidden when generating visual displays of the resource, but should still be accessible to free text search operations.
 * @property {skosxl_Label[]} [hiddenLabelXL] - Associates an skosxl:Label with a skos:Concept. The property is analogous to skos:hiddenLabel.
 * @property {(LiteralNode|LiteralNode|string)[]} [historyNote] - A note about the past state/use/meaning of a concept.
 * @property {skos_Concept[]} [narrower] - Relates a concept to a concept that is more specific in meaning.
 * @property {(boolean|number|string|LiteralNode|NamedNode)[]} [notation] - A notation, also known as classification code, is a string of characters such as "T58.5" or "303.4833" used to uniquely identify a concept within the scope of a given concept scheme.
 * @property {(LiteralNode|LiteralNode|string)[]} [note] - A general note, for any purpose.
 * @property {(LiteralNode|string)[]} [prefLabel] - The preferred lexical label for a resource, in a given language.
 * @property {rdfs_Class[]} [rdf_type]
 * @property {skos_Concept[]} [related] - Relates a concept to a concept with which there is an associative semantic relationship.
 * @property {skos_Concept[]} [relatedMatch] - Used to state an associative mapping link between two conceptual resources in different concept schemes.
 * @property {(LiteralNode|LiteralNode|string)[]} [scopeNote] - A note that helps to clarify the meaning and/or the use of a concept.
 * @property {skos_ConceptScheme[]} [topConceptOf]
 * @typedef {NamedNode_Props & skos_Concept_Props_Int} skos_Concept_Props
 */

/**
 * Generated from the shape http://www.w3.org/2004/02/skos/core#ConceptScheme
 */
class skos_ConceptScheme extends NamedNode {

	constructor(obj) {
		super(typeof obj == 'string' ? { uri: obj } : obj);
	}
	
	/**
	 * (No sh:description found)
	 * The RDF path is <http://www.w3.org/2000/01/rdf-schema#comment>
	 * @returns {(LiteralNode|LiteralNode|string)[]}
	 */
	get comment() {
	}
	
	set comment(values) {
	}
	
	/**
	 * Relates, by convention, a concept scheme to a concept which is topmost in the broader/narrower concept hierarchies for that scheme, providing an entry point to these hierarchies.
	 * The RDF path is <http://www.w3.org/2004/02/skos/core#hasTopConcept>
	 * @returns {skos_Concept[]}
	 */
	get hasTopConcept() {
	}
	
	set hasTopConcept(values) {
	}
	
	/**
	 * True to hide this concept scheme from Taxonomy hierarchies displays.
	 * The RDF path is <http://datashapes.org/dash#hidden>
	 * @returns {?boolean | ?LiteralNode}
	 */
	get hidden() {
	}
	
	set hidden(value) {
	}
	
	/**
	 * (No sh:description found)
	 * The RDF path is <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>
	 * @returns {rdfs_Class[]}
	 */
	get rdf_type() {
	}
	
	set rdf_type(values) {
	}
	
	/**
	 * (No sh:description found)
	 * The RDF path is <http://www.w3.org/2000/01/rdf-schema#label>
	 * @returns {(LiteralNode|string)[]}
	 */
	get rdfs_label() {
	}
	
	set rdfs_label(values) {
	}
}
GraphNodeUtil.classes['skos_ConceptScheme'] = skos_ConceptScheme;
Object.defineProperty(skos_ConceptScheme.prototype, 'comment', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2000/01/rdf-schema#comment>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2000/01/rdf-schema#comment', values, null);
	}
});
Object.defineProperty(skos_ConceptScheme.prototype, 'hasTopConcept', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2004/02/skos/core#hasTopConcept>', skos_Concept);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2004/02/skos/core#hasTopConcept', values, null);
	}
});
Object.defineProperty(skos_ConceptScheme.prototype, 'hidden', {
	enumerable: true,
	get() {
		return this.value('<http://datashapes.org/dash#hidden>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://datashapes.org/dash#hidden', value, 'http://www.w3.org/2001/XMLSchema#boolean');
	}
});
Object.defineProperty(skos_ConceptScheme.prototype, 'rdf_type', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>', rdfs_Class);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', values, null);
	}
});
Object.defineProperty(skos_ConceptScheme.prototype, 'rdfs_label', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2000/01/rdf-schema#label>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2000/01/rdf-schema#label', values, null);
	}
});

/**
 * Describes the properties of instances of http://www.w3.org/2004/02/skos/core#ConceptScheme
 * @typedef skos_ConceptScheme_Props_Int
 * @property {(LiteralNode|LiteralNode|string)[]} [comment]
 * @property {skos_Concept[]} [hasTopConcept] - Relates, by convention, a concept scheme to a concept which is topmost in the broader/narrower concept hierarchies for that scheme, providing an entry point to these hierarchies.
 * @property {?boolean | ?LiteralNode} [hidden] - True to hide this concept scheme from Taxonomy hierarchies displays.
 * @property {rdfs_Class[]} [rdf_type]
 * @property {(LiteralNode|string)[]} [rdfs_label]
 * @typedef {NamedNode_Props & skos_ConceptScheme_Props_Int} skos_ConceptScheme_Props
 */

/**
 * Generated from the shape http://www.w3.org/2008/05/skos-xl#Label
 */
class skosxl_Label extends NamedNode {

	constructor(obj) {
		super(typeof obj == 'string' ? { uri: obj } : obj);
	}
	
	/**
	 * Used to return the (default) icon for SKOS labels.
	 * The RDF path is <http://www.w3.org/2008/05/skos-xl#icon>
	 * @returns {?string | ?LiteralNode}
	 */
	get icon() {
	}
	
	set icon(value) {
	}
	
	/**
	 * (No sh:description found)
	 * The RDF path is <http://www.w3.org/2008/05/skos-xl#literalForm>
	 * @returns {(LiteralNode|string)[]}
	 */
	get literalForm() {
	}
	
	set literalForm(values) {
	}
}
GraphNodeUtil.classes['skosxl_Label'] = skosxl_Label;
Object.defineProperty(skosxl_Label.prototype, 'icon', {
	enumerable: true,
	get() {
		return this.value('<http://www.w3.org/2008/05/skos-xl#icon>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://www.w3.org/2008/05/skos-xl#icon', value, 'http://www.w3.org/2001/XMLSchema#string');
	}
});
Object.defineProperty(skosxl_Label.prototype, 'literalForm', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2008/05/skos-xl#literalForm>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2008/05/skos-xl#literalForm', values, null);
	}
});

/**
 * Describes the properties of instances of http://www.w3.org/2008/05/skos-xl#Label
 * @typedef skosxl_Label_Props_Int
 * @property {?string | ?LiteralNode} [icon] - Used to return the (default) icon for SKOS labels.
 * @property {(LiteralNode|string)[]} [literalForm]
 * @typedef {NamedNode_Props & skosxl_Label_Props_Int} skosxl_Label_Props
 */

/**
 * Generated from the shape http://www.w3.org/2002/07/owl#Ontology
 */
class owl_Ontology extends graphql_Schema {

	constructor(obj) {
		super(typeof obj == 'string' ? { uri: obj } : obj);
	}
	
	/**
	 * The comments of this, possibly in multiple languages.
	 * The RDF path is <http://www.w3.org/2000/01/rdf-schema#comment>
	 * @returns {(LiteralNode|LiteralNode|string)[]}
	 */
	get comments() {
	}
	
	set comments(values) {
	}
	
	/**
	 * The (directly) imported graphs.
	 * The RDF path is <http://www.w3.org/2002/07/owl#imports>
	 * @returns {NamedNode[]}
	 */
	get imports() {
	}
	
	set imports(values) {
	}
	
	/**
	 * The display name(s) of this, possibly in multiple languages.
	 * The RDF path is <http://www.w3.org/2000/01/rdf-schema#label>
	 * @returns {(LiteralNode|string)[]}
	 */
	get labels() {
	}
	
	set labels(values) {
	}
}
GraphNodeUtil.classes['owl_Ontology'] = owl_Ontology;
Object.defineProperty(owl_Ontology.prototype, 'comments', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2000/01/rdf-schema#comment>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2000/01/rdf-schema#comment', values, null);
	}
});
Object.defineProperty(owl_Ontology.prototype, 'imports', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2002/07/owl#imports>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2002/07/owl#imports', values, null);
	}
});
Object.defineProperty(owl_Ontology.prototype, 'labels', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2000/01/rdf-schema#label>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2000/01/rdf-schema#label', values, null);
	}
});

/**
 * Describes the properties of instances of http://www.w3.org/2002/07/owl#Ontology
 * @typedef owl_Ontology_Props_Int
 * @property {(LiteralNode|LiteralNode|string)[]} [comments] - The comments of this, possibly in multiple languages.
 * @property {NamedNode[]} [imports] - The (directly) imported graphs.
 * @property {(LiteralNode|string)[]} [labels] - The display name(s) of this, possibly in multiple languages.
 * @typedef {graphql_Schema_Props & owl_Ontology_Props_Int} owl_Ontology_Props
 */

/**
 * Generated from the shape http://www.w3.org/2002/07/owl#Class
 */
class owl_Class extends rdfs_Class {

	constructor(obj) {
		super(typeof obj == 'string' ? { uri: obj } : obj);
	}
}
GraphNodeUtil.classes['owl_Class'] = owl_Class;

/**
 * Describes the properties of instances of http://www.w3.org/2002/07/owl#Class
 * @typedef owl_Class_Props_Int
 * @typedef {rdfs_Class_Props & owl_Class_Props_Int} owl_Class_Props
 */

/**
 * Generated from the shape http://www.w3.org/2000/01/rdf-schema#Datatype
 */
class rdfs_Datatype extends rdfs_Class {

	constructor(obj) {
		super(typeof obj == 'string' ? { uri: obj } : obj);
	}
}
GraphNodeUtil.classes['rdfs_Datatype'] = rdfs_Datatype;

/**
 * Describes the properties of instances of http://www.w3.org/2000/01/rdf-schema#Datatype
 * @typedef rdfs_Datatype_Props_Int
 * @typedef {rdfs_Class_Props & rdfs_Datatype_Props_Int} rdfs_Datatype_Props
 */

/**
 * Generated from the shape http://www.w3.org/ns/shacl#TargetType
 */
class sh_TargetType extends rdfs_Class {

	constructor(obj) {
		super(typeof obj == 'string' ? { uri: obj } : obj);
	}
	
	/**
	 * The comments of this, possibly in multiple languages.
	 * The RDF path is <http://www.w3.org/2000/01/rdf-schema#comment>
	 * @returns {(LiteralNode|LiteralNode|string)[]}
	 */
	get comments() {
	}
	
	set comments(values) {
	}
	
	/**
	 * Outlines how human-readable labels of instances of the associated Parameterizable shall be produced. The values can contain {?paramName} as placeholders for the actual values of the given parameter.
	 * The RDF path is <http://www.w3.org/ns/shacl#labelTemplate>
	 * @returns {(LiteralNode|string)[]}
	 */
	get labelTemplate() {
	}
	
	set labelTemplate(values) {
	}
	
	/**
	 * The display name(s) of this, possibly in multiple languages.
	 * The RDF path is <http://www.w3.org/2000/01/rdf-schema#label>
	 * @returns {(LiteralNode|string)[]}
	 */
	get labels() {
	}
	
	set labels(values) {
	}
	
	/**
	 * The input parameters.
	 * The RDF path is <http://www.w3.org/ns/shacl#parameter>
	 * @returns {sh_Parameter[]}
	 */
	get parameter() {
	}
	
	set parameter(values) {
	}
	
	/**
	 * The type(s) of this.
	 * The RDF path is <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>
	 * @returns {rdfs_Class[]}
	 */
	get types() {
	}
	
	set types(values) {
	}
}
GraphNodeUtil.classes['sh_TargetType'] = sh_TargetType;
Object.defineProperty(sh_TargetType.prototype, 'comments', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2000/01/rdf-schema#comment>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2000/01/rdf-schema#comment', values, null);
	}
});
Object.defineProperty(sh_TargetType.prototype, 'labelTemplate', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/ns/shacl#labelTemplate>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/ns/shacl#labelTemplate', values, null);
	}
});
Object.defineProperty(sh_TargetType.prototype, 'labels', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2000/01/rdf-schema#label>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2000/01/rdf-schema#label', values, null);
	}
});
Object.defineProperty(sh_TargetType.prototype, 'parameter', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/ns/shacl#parameter>', sh_Parameter);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/ns/shacl#parameter', values, null);
	}
});
Object.defineProperty(sh_TargetType.prototype, 'types', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>', rdfs_Class);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', values, null);
	}
});

/**
 * Describes the properties of instances of http://www.w3.org/ns/shacl#TargetType
 * @typedef sh_TargetType_Props_Int
 * @property {(LiteralNode|LiteralNode|string)[]} [comments] - The comments of this, possibly in multiple languages.
 * @property {(LiteralNode|string)[]} [labelTemplate] - Outlines how human-readable labels of instances of the associated Parameterizable shall be produced. The values can contain {?paramName} as placeholders for the actual values of the given parameter.
 * @property {(LiteralNode|string)[]} [labels] - The display name(s) of this, possibly in multiple languages.
 * @property {sh_Parameter[]} [parameter] - The input parameters.
 * @property {rdfs_Class[]} [types] - The type(s) of this.
 * @typedef {rdfs_Class_Props & sh_TargetType_Props_Int} sh_TargetType_Props
 */

/**
 * Generated from the shape http://datashapes.org/dash#ShapeClass
 */
class dash_ShapeClass extends rdfs_Class {

	constructor(obj) {
		super(typeof obj == 'string' ? { uri: obj } : obj);
	}
	
	/**
	 * Links a node shape with the classes that it can be applied to.
	 * The RDF path is <http://datashapes.org/dash#applicableToClass>
	 * @returns {rdfs_Class[]}
	 */
	get applicableToClass() {
	}
	
	set applicableToClass(values) {
	}
	
	/**
	 * The comments of this, possibly in multiple languages.
	 * The RDF path is <http://www.w3.org/2000/01/rdf-schema#comment>
	 * @returns {(LiteralNode|LiteralNode|string)[]}
	 */
	get comments() {
	}
	
	set comments(values) {
	}
	
	/**
	 * True to deactivate this shape, making it literally invisible and without any effect.
	 * The RDF path is <http://www.w3.org/ns/shacl#deactivated>
	 * @returns {?boolean | ?LiteralNode}
	 */
	get deactivated() {
	}
	
	set deactivated(value) {
	}
	
	/**
	 * The user roles that this shape shall be used as default view for.
	 * The RDF path is <http://datashapes.org/dash#defaultViewForRole>
	 * @returns {NamedNode[]}
	 */
	get defaultViewForRole() {
	}
	
	set defaultViewForRole(values) {
	}
	
	/**
	 * Returns all property shapes that have been declared at "super-shapes" (via sh:node) or "superclasses" (via rdfs:subClassOf), including the indirect supers, recursively.
	 * The RDF path is <http://topbraid.org/tosh#inheritedProperty>
	 * @returns {NamedNode[]}
	 */
	get inheritedProperty() {
	}
	
	/**
	 * The display name(s) of this, possibly in multiple languages.
	 * The RDF path is <http://www.w3.org/2000/01/rdf-schema#label>
	 * @returns {(LiteralNode|string)[]}
	 */
	get labels() {
	}
	
	set labels(values) {
	}
	
	/**
	 * The properties declared for this, using SHACL property shapes.
	 * The RDF path is <http://www.w3.org/ns/shacl#property>
	 * @returns {sh_PropertyShape[]}
	 */
	get properties() {
	}
	
	set properties(values) {
	}
	
	/**
	 * The severity to be used for validation results produced by the constraints.
	 * The RDF path is <http://www.w3.org/ns/shacl#severity>
	 * @returns {?NamedNode}
	 */
	get severity() {
	}
	
	set severity(value) {
	}
	
	/**
	 * The node shapes that this must also conform to, forming a kind of inheritance between shapes similar to a subclass-of relationship.
	 * The RDF path is <http://www.w3.org/ns/shacl#node>
	 * @returns {sh_NodeShape[]}
	 */
	get supershapes() {
	}
	
	set supershapes(values) {
	}
	
	/**
	 * The types of instances that this shape is targeted at.
	 * The RDF path is <http://www.w3.org/ns/shacl#targetClass>
	 * @returns {rdfs_Class[]}
	 */
	get targetClasses() {
	}
	
	set targetClasses(values) {
	}
	
	/**
	 * (No sh:description found)
	 * The RDF path is <http://www.w3.org/ns/shacl#targetObjectsOf>
	 * @returns {rdf_Property[]}
	 */
	get targetObjectsOf() {
	}
	
	set targetObjectsOf(values) {
	}
	
	/**
	 * (No sh:description found)
	 * The RDF path is <http://www.w3.org/ns/shacl#targetSubjectsOf>
	 * @returns {rdf_Property[]}
	 */
	get targetSubjectsOf() {
	}
	
	set targetSubjectsOf(values) {
	}
	
	/**
	 * The type(s) of this.
	 * The RDF path is <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>
	 * @returns {rdfs_Class[]}
	 */
	get types() {
	}
	
	set types(values) {
	}
	
	// Shape script injected from http://topbraid.org/tosh#NodeShape-ShapeScript


    /**
     * Returns this class as an instance of rdfs_Class, assuming this node shape is also a class.
     * @returns {rdfs_Class}
     */
    asClass() {
		return rdfs.asClass(this);
	}

	/**
	 * Gets the "nearest" constraint of a given type and a given path property. Deactivated shapes are skipped.
	 * For example, call it with (ex.myProperty, sh.datatype) to find the closest sh:datatype constraint for ex:myProperty.
	 * @param {NamedNode} path  the property that is the sh:path of matching property shapes
	 * @param {NamedNode} predicate  the property to fetch the nearest value of
	 */
	nearestPropertyShapeValue(path, predicate) {
		return this.walkSupershapes(s => {
			if(!s.deactivated) {
				let ps = s.properties;
				for(let i = 0; i < ps.length; i++) {
					if(!ps[i].deactivated && graph.contains(ps[i], sh.path, path)) {
						let value = ps[i].value(predicate);
						if(value !== null && value !== undefined) {
							return value;
						}
					}
				}
			}
		})
	}

    /**
     * @callback sh_NodeShape_callback
     * @param {sh_NodeShape} nodeShape  the visited node shape
     */

    /**
     * Performs a depth-first traversal of this and its superclasses (via rdfs:subClassOf) and supershapes (via sh:node),
     * visiting each (super) shape once until the callback function returns a non-null/undefined result. This becomes the result of this function.
     * The order in which sibling parents are traversed is undefined.
     * @param {sh_NodeShape_callback} callback  the callback for each shape
     * @param {Set} [reached]  the Set of reached URI strings, used internally but may also be used to terminate at certain supers
     * @returns the return value of the first callback that returned any value
     */
    walkSupershapes(callback, reached) {
        if(!reached) {
            reached = new Set();
        }
        if(!reached.has(this.uri)) {
            reached.add(this.uri);
            let result = callback(this);
            if(result !== undefined && result !== null) {
                return result;
            }
            let superClasses = this.asClass().superclasses;
            for(let i = 0; i < superClasses.length; i++) {
                result = superClasses[i].asNodeShape().walkSupershapes(callback, reached);
                if(result !== undefined && result !== null) {
                    return result;
                }
            }
            let superShapes = this.supershapes;
            for(let i = 0; i < superShapes.length; i++) {
                result = superShapes[i].walkSupershapes(callback, reached);
                if(result !== undefined && result !== null) {
                    return result;
                }
            }
        }
    }

}
GraphNodeUtil.classes['dash_ShapeClass'] = dash_ShapeClass;
Object.defineProperty(dash_ShapeClass.prototype, 'applicableToClass', {
	enumerable: true,
	get() {
		return this.values('<http://datashapes.org/dash#applicableToClass>', rdfs_Class);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://datashapes.org/dash#applicableToClass', values, null);
	}
});
Object.defineProperty(dash_ShapeClass.prototype, 'comments', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2000/01/rdf-schema#comment>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2000/01/rdf-schema#comment', values, null);
	}
});
Object.defineProperty(dash_ShapeClass.prototype, 'deactivated', {
	enumerable: true,
	get() {
		return this.value('<http://www.w3.org/ns/shacl#deactivated>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://www.w3.org/ns/shacl#deactivated', value, 'http://www.w3.org/2001/XMLSchema#boolean');
	}
});
Object.defineProperty(dash_ShapeClass.prototype, 'defaultViewForRole', {
	enumerable: true,
	get() {
		return this.values('<http://datashapes.org/dash#defaultViewForRole>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://datashapes.org/dash#defaultViewForRole', values, null);
	}
});
Object.defineProperty(dash_ShapeClass.prototype, 'inheritedProperty', {
	enumerable: true,
	get() {
		return this.values('<http://topbraid.org/tosh#inheritedProperty>', null);
	},
});
Object.defineProperty(dash_ShapeClass.prototype, 'labels', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2000/01/rdf-schema#label>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2000/01/rdf-schema#label', values, null);
	}
});
Object.defineProperty(dash_ShapeClass.prototype, 'properties', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/ns/shacl#property>', sh_PropertyShape);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/ns/shacl#property', values, null);
	}
});
Object.defineProperty(dash_ShapeClass.prototype, 'severity', {
	enumerable: true,
	get() {
		return this.value('<http://www.w3.org/ns/shacl#severity>', NamedNode);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://www.w3.org/ns/shacl#severity', value, null);
	}
});
Object.defineProperty(dash_ShapeClass.prototype, 'supershapes', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/ns/shacl#node>', sh_NodeShape);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/ns/shacl#node', values, null);
	}
});
Object.defineProperty(dash_ShapeClass.prototype, 'targetClasses', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/ns/shacl#targetClass>', rdfs_Class);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/ns/shacl#targetClass', values, null);
	}
});
Object.defineProperty(dash_ShapeClass.prototype, 'targetObjectsOf', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/ns/shacl#targetObjectsOf>', rdf_Property);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/ns/shacl#targetObjectsOf', values, null);
	}
});
Object.defineProperty(dash_ShapeClass.prototype, 'targetSubjectsOf', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/ns/shacl#targetSubjectsOf>', rdf_Property);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/ns/shacl#targetSubjectsOf', values, null);
	}
});
Object.defineProperty(dash_ShapeClass.prototype, 'types', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>', rdfs_Class);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', values, null);
	}
});

/**
 * Describes the properties of instances of http://datashapes.org/dash#ShapeClass
 * @typedef dash_ShapeClass_Props_Int
 * @property {rdfs_Class[]} [applicableToClass] - Links a node shape with the classes that it can be applied to.
 * @property {(LiteralNode|LiteralNode|string)[]} [comments] - The comments of this, possibly in multiple languages.
 * @property {?boolean | ?LiteralNode} [deactivated] - True to deactivate this shape, making it literally invisible and without any effect.
 * @property {NamedNode[]} [defaultViewForRole] - The user roles that this shape shall be used as default view for.
 * @property {(LiteralNode|string)[]} [labels] - The display name(s) of this, possibly in multiple languages.
 * @property {sh_PropertyShape[]} [properties] - The properties declared for this, using SHACL property shapes.
 * @property {?NamedNode} [severity] - The severity to be used for validation results produced by the constraints.
 * @property {sh_NodeShape[]} [supershapes] - The node shapes that this must also conform to, forming a kind of inheritance between shapes similar to a subclass-of relationship.
 * @property {rdfs_Class[]} [targetClasses] - The types of instances that this shape is targeted at.
 * @property {rdf_Property[]} [targetObjectsOf]
 * @property {rdf_Property[]} [targetSubjectsOf]
 * @property {rdfs_Class[]} [types] - The type(s) of this.
 * @typedef {rdfs_Class_Props & dash_ShapeClass_Props_Int} dash_ShapeClass_Props
 */

/**
 * Generated from the shape http://www.w3.org/ns/shacl#ConstraintComponent
 */
class sh_ConstraintComponent extends sh_Parameterizable {

	constructor(obj) {
		super(typeof obj == 'string' ? { uri: obj } : obj);
	}
	
	/**
	 * Outlines how human-readable labels of instances of the associated Parameterizable shall be produced. The values can contain {?paramName} as placeholders for the actual values of the given parameter.
	 * The RDF path is <http://www.w3.org/ns/shacl#labelTemplate>
	 * @returns {(LiteralNode|string)[]}
	 */
	get labelTemplate() {
	}
	
	set labelTemplate(values) {
	}
	
	/**
	 * (No sh:description found)
	 * The RDF path is <http://datashapes.org/dash#localConstraint>
	 * @returns {?boolean | ?LiteralNode}
	 */
	get localConstraint() {
	}
	
	set localConstraint(value) {
	}
	
	/**
	 * The message to generate on violations.
	 * The RDF path is <http://www.w3.org/ns/shacl#message>
	 * @returns {(LiteralNode|string)[]}
	 */
	get message() {
	}
	
	set message(values) {
	}
	
	/**
	 * The validator(s) used to evaluate a constraint in the context of a node shape.
	 * The RDF path is <http://www.w3.org/ns/shacl#nodeValidator>
	 * @returns {NamedNode[]}
	 */
	get nodeValidator() {
	}
	
	set nodeValidator(values) {
	}
	
	/**
	 * (No sh:description found)
	 * The RDF path is <http://datashapes.org/dash#propertySuggestionGenerator>
	 * @returns {NamedNode[]}
	 */
	get propertySuggestionGenerator() {
	}
	
	set propertySuggestionGenerator(values) {
	}
	
	/**
	 * The validator(s) used to evaluate a constraint in the context of a property shape.
	 * The RDF path is <http://www.w3.org/ns/shacl#propertyValidator>
	 * @returns {NamedNode[]}
	 */
	get propertyValidator() {
	}
	
	set propertyValidator(values) {
	}
	
	/**
	 * (No sh:description found)
	 * The RDF path is <http://datashapes.org/dash#staticConstraint>
	 * @returns {?boolean | ?LiteralNode}
	 */
	get staticConstraint() {
	}
	
	set staticConstraint(value) {
	}
	
	/**
	 * The validator(s) used to evaluate constraints of either node or property shapes, unless more specific validators are available.
	 * The RDF path is <http://www.w3.org/ns/shacl#validator>
	 * @returns {NamedNode[]}
	 */
	get validator() {
	}
	
	set validator(values) {
	}
}
GraphNodeUtil.classes['sh_ConstraintComponent'] = sh_ConstraintComponent;
Object.defineProperty(sh_ConstraintComponent.prototype, 'labelTemplate', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/ns/shacl#labelTemplate>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/ns/shacl#labelTemplate', values, null);
	}
});
Object.defineProperty(sh_ConstraintComponent.prototype, 'localConstraint', {
	enumerable: true,
	get() {
		return this.value('<http://datashapes.org/dash#localConstraint>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://datashapes.org/dash#localConstraint', value, 'http://www.w3.org/2001/XMLSchema#boolean');
	}
});
Object.defineProperty(sh_ConstraintComponent.prototype, 'message', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/ns/shacl#message>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/ns/shacl#message', values, null);
	}
});
Object.defineProperty(sh_ConstraintComponent.prototype, 'nodeValidator', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/ns/shacl#nodeValidator>', NamedNode);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/ns/shacl#nodeValidator', values, null);
	}
});
Object.defineProperty(sh_ConstraintComponent.prototype, 'propertySuggestionGenerator', {
	enumerable: true,
	get() {
		return this.values('<http://datashapes.org/dash#propertySuggestionGenerator>', NamedNode);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://datashapes.org/dash#propertySuggestionGenerator', values, null);
	}
});
Object.defineProperty(sh_ConstraintComponent.prototype, 'propertyValidator', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/ns/shacl#propertyValidator>', NamedNode);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/ns/shacl#propertyValidator', values, null);
	}
});
Object.defineProperty(sh_ConstraintComponent.prototype, 'staticConstraint', {
	enumerable: true,
	get() {
		return this.value('<http://datashapes.org/dash#staticConstraint>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://datashapes.org/dash#staticConstraint', value, 'http://www.w3.org/2001/XMLSchema#boolean');
	}
});
Object.defineProperty(sh_ConstraintComponent.prototype, 'validator', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/ns/shacl#validator>', NamedNode);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/ns/shacl#validator', values, null);
	}
});

/**
 * Describes the properties of instances of http://www.w3.org/ns/shacl#ConstraintComponent
 * @typedef sh_ConstraintComponent_Props_Int
 * @property {(LiteralNode|string)[]} [labelTemplate] - Outlines how human-readable labels of instances of the associated Parameterizable shall be produced. The values can contain {?paramName} as placeholders for the actual values of the given parameter.
 * @property {?boolean | ?LiteralNode} [localConstraint]
 * @property {(LiteralNode|string)[]} [message] - The message to generate on violations.
 * @property {NamedNode[]} [nodeValidator] - The validator(s) used to evaluate a constraint in the context of a node shape.
 * @property {NamedNode[]} [propertySuggestionGenerator]
 * @property {NamedNode[]} [propertyValidator] - The validator(s) used to evaluate a constraint in the context of a property shape.
 * @property {?boolean | ?LiteralNode} [staticConstraint]
 * @property {NamedNode[]} [validator] - The validator(s) used to evaluate constraints of either node or property shapes, unless more specific validators are available.
 * @typedef {sh_Parameterizable_Props & sh_ConstraintComponent_Props_Int} sh_ConstraintComponent_Props
 */

/**
 * Generated from the shape http://www.w3.org/ns/shacl#SPARQLRule
 */
class sh_SPARQLRule extends sh_Rule {

	constructor(obj) {
		super(typeof obj == 'string' ? { uri: obj } : obj);
	}
}
GraphNodeUtil.classes['sh_SPARQLRule'] = sh_SPARQLRule;

/**
 * Describes the properties of instances of http://www.w3.org/ns/shacl#SPARQLRule
 * @typedef sh_SPARQLRule_Props_Int
 * @typedef {sh_Rule_Props & sh_SPARQLRule_Props_Int} sh_SPARQLRule_Props
 */

/**
 * Generated from the shape http://www.w3.org/ns/shacl#TripleRule
 */
class sh_TripleRule extends sh_Rule {

	constructor(obj) {
		super(typeof obj == 'string' ? { uri: obj } : obj);
	}
	
	/**
	 * The node expression producing the object(s) of the triple inferred by the rule.
	 * The RDF path is <http://www.w3.org/ns/shacl#object>
	 * @returns {?boolean | ?number | ?string | ?LiteralNode | ?NamedNode}
	 */
	get object() {
	}
	
	set object(value) {
	}
	
	/**
	 * The node expression producing the predicate(s) of the triple inferred by the rule.
	 * The RDF path is <http://www.w3.org/ns/shacl#predicate>
	 * @returns {?NamedNode}
	 */
	get predicate() {
	}
	
	set predicate(value) {
	}
	
	/**
	 * The node expression producing the subject(s) of the triple inferred by the rule.
	 * The RDF path is <http://www.w3.org/ns/shacl#subject>
	 * @returns {?NamedNode}
	 */
	get subject() {
	}
	
	set subject(value) {
	}
}
GraphNodeUtil.classes['sh_TripleRule'] = sh_TripleRule;
Object.defineProperty(sh_TripleRule.prototype, 'object', {
	enumerable: true,
	get() {
		return this.value('<http://www.w3.org/ns/shacl#object>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://www.w3.org/ns/shacl#object', value, null);
	}
});
Object.defineProperty(sh_TripleRule.prototype, 'predicate', {
	enumerable: true,
	get() {
		return this.value('<http://www.w3.org/ns/shacl#predicate>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://www.w3.org/ns/shacl#predicate', value, null);
	}
});
Object.defineProperty(sh_TripleRule.prototype, 'subject', {
	enumerable: true,
	get() {
		return this.value('<http://www.w3.org/ns/shacl#subject>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://www.w3.org/ns/shacl#subject', value, null);
	}
});

/**
 * Describes the properties of instances of http://www.w3.org/ns/shacl#TripleRule
 * @typedef sh_TripleRule_Props_Int
 * @property {?boolean | ?number | ?string | ?LiteralNode | ?NamedNode} [object] - The node expression producing the object(s) of the triple inferred by the rule.
 * @property {?NamedNode} [predicate] - The node expression producing the predicate(s) of the triple inferred by the rule.
 * @property {?NamedNode} [subject] - The node expression producing the subject(s) of the triple inferred by the rule.
 * @typedef {sh_Rule_Props & sh_TripleRule_Props_Int} sh_TripleRule_Props
 */

/**
 * Generated from the shape http://www.w3.org/ns/shacl#NodeShape
 */
class sh_NodeShape extends sh_Shape {

	constructor(obj) {
		super(typeof obj == 'string' ? { uri: obj } : obj);
	}
	
	/**
	 * Links a node shape with the classes that it can be applied to.
	 * The RDF path is <http://datashapes.org/dash#applicableToClass>
	 * @returns {rdfs_Class[]}
	 */
	get applicableToClass() {
	}
	
	set applicableToClass(values) {
	}
	
	/**
	 * The comments of this, possibly in multiple languages.
	 * The RDF path is <http://www.w3.org/2000/01/rdf-schema#comment>
	 * @returns {(LiteralNode|LiteralNode|string)[]}
	 */
	get comments() {
	}
	
	set comments(values) {
	}
	
	/**
	 * The user roles that this shape shall be used as default view for.
	 * The RDF path is <http://datashapes.org/dash#defaultViewForRole>
	 * @returns {NamedNode[]}
	 */
	get defaultViewForRole() {
	}
	
	set defaultViewForRole(values) {
	}
	
	/**
	 * Returns all property shapes that have been declared at "super-shapes" (via sh:node) or "superclasses" (via rdfs:subClassOf), including the indirect supers, recursively.
	 * The RDF path is <http://topbraid.org/tosh#inheritedProperty>
	 * @returns {NamedNode[]}
	 */
	get inheritedProperty() {
	}
	
	/**
	 * The display name(s) of this, possibly in multiple languages.
	 * The RDF path is <http://www.w3.org/2000/01/rdf-schema#label>
	 * @returns {(LiteralNode|string)[]}
	 */
	get labels() {
	}
	
	set labels(values) {
	}
	
	/**
	 * The properties declared for this, using SHACL property shapes.
	 * The RDF path is <http://www.w3.org/ns/shacl#property>
	 * @returns {sh_PropertyShape[]}
	 */
	get properties() {
	}
	
	set properties(values) {
	}
	
	/**
	 * The severity to be used for validation results produced by the constraints.
	 * The RDF path is <http://www.w3.org/ns/shacl#severity>
	 * @returns {?NamedNode}
	 */
	get severity() {
	}
	
	set severity(value) {
	}
	
	/**
	 * The node shapes that this must also conform to, forming a kind of inheritance between shapes similar to a subclass-of relationship.
	 * The RDF path is <http://www.w3.org/ns/shacl#node>
	 * @returns {sh_NodeShape[]}
	 */
	get supershapes() {
	}
	
	set supershapes(values) {
	}
	
	/**
	 * The types of instances that this shape is targeted at.
	 * The RDF path is <http://www.w3.org/ns/shacl#targetClass>
	 * @returns {rdfs_Class[]}
	 */
	get targetClasses() {
	}
	
	set targetClasses(values) {
	}
	
	/**
	 * (No sh:description found)
	 * The RDF path is <http://www.w3.org/ns/shacl#targetObjectsOf>
	 * @returns {rdf_Property[]}
	 */
	get targetObjectsOf() {
	}
	
	set targetObjectsOf(values) {
	}
	
	/**
	 * (No sh:description found)
	 * The RDF path is <http://www.w3.org/ns/shacl#targetSubjectsOf>
	 * @returns {rdf_Property[]}
	 */
	get targetSubjectsOf() {
	}
	
	set targetSubjectsOf(values) {
	}
	
	/**
	 * The type(s) of this.
	 * The RDF path is <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>
	 * @returns {rdfs_Class[]}
	 */
	get types() {
	}
	
	set types(values) {
	}
	
	// Shape script injected from http://topbraid.org/tosh#NodeShape-ShapeScript


    /**
     * Returns this class as an instance of rdfs_Class, assuming this node shape is also a class.
     * @returns {rdfs_Class}
     */
    asClass() {
		return rdfs.asClass(this);
	}

	/**
	 * Gets the "nearest" constraint of a given type and a given path property. Deactivated shapes are skipped.
	 * For example, call it with (ex.myProperty, sh.datatype) to find the closest sh:datatype constraint for ex:myProperty.
	 * @param {NamedNode} path  the property that is the sh:path of matching property shapes
	 * @param {NamedNode} predicate  the property to fetch the nearest value of
	 */
	nearestPropertyShapeValue(path, predicate) {
		return this.walkSupershapes(s => {
			if(!s.deactivated) {
				let ps = s.properties;
				for(let i = 0; i < ps.length; i++) {
					if(!ps[i].deactivated && graph.contains(ps[i], sh.path, path)) {
						let value = ps[i].value(predicate);
						if(value !== null && value !== undefined) {
							return value;
						}
					}
				}
			}
		})
	}

    /**
     * @callback sh_NodeShape_callback
     * @param {sh_NodeShape} nodeShape  the visited node shape
     */

    /**
     * Performs a depth-first traversal of this and its superclasses (via rdfs:subClassOf) and supershapes (via sh:node),
     * visiting each (super) shape once until the callback function returns a non-null/undefined result. This becomes the result of this function.
     * The order in which sibling parents are traversed is undefined.
     * @param {sh_NodeShape_callback} callback  the callback for each shape
     * @param {Set} [reached]  the Set of reached URI strings, used internally but may also be used to terminate at certain supers
     * @returns the return value of the first callback that returned any value
     */
    walkSupershapes(callback, reached) {
        if(!reached) {
            reached = new Set();
        }
        if(!reached.has(this.uri)) {
            reached.add(this.uri);
            let result = callback(this);
            if(result !== undefined && result !== null) {
                return result;
            }
            let superClasses = this.asClass().superclasses;
            for(let i = 0; i < superClasses.length; i++) {
                result = superClasses[i].asNodeShape().walkSupershapes(callback, reached);
                if(result !== undefined && result !== null) {
                    return result;
                }
            }
            let superShapes = this.supershapes;
            for(let i = 0; i < superShapes.length; i++) {
                result = superShapes[i].walkSupershapes(callback, reached);
                if(result !== undefined && result !== null) {
                    return result;
                }
            }
        }
    }

}
GraphNodeUtil.classes['sh_NodeShape'] = sh_NodeShape;
Object.defineProperty(sh_NodeShape.prototype, 'applicableToClass', {
	enumerable: true,
	get() {
		return this.values('<http://datashapes.org/dash#applicableToClass>', rdfs_Class);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://datashapes.org/dash#applicableToClass', values, null);
	}
});
Object.defineProperty(sh_NodeShape.prototype, 'comments', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2000/01/rdf-schema#comment>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2000/01/rdf-schema#comment', values, null);
	}
});
Object.defineProperty(sh_NodeShape.prototype, 'defaultViewForRole', {
	enumerable: true,
	get() {
		return this.values('<http://datashapes.org/dash#defaultViewForRole>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://datashapes.org/dash#defaultViewForRole', values, null);
	}
});
Object.defineProperty(sh_NodeShape.prototype, 'inheritedProperty', {
	enumerable: true,
	get() {
		return this.values('<http://topbraid.org/tosh#inheritedProperty>', null);
	},
});
Object.defineProperty(sh_NodeShape.prototype, 'labels', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2000/01/rdf-schema#label>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2000/01/rdf-schema#label', values, null);
	}
});
Object.defineProperty(sh_NodeShape.prototype, 'properties', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/ns/shacl#property>', sh_PropertyShape);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/ns/shacl#property', values, null);
	}
});
Object.defineProperty(sh_NodeShape.prototype, 'severity', {
	enumerable: true,
	get() {
		return this.value('<http://www.w3.org/ns/shacl#severity>', NamedNode);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://www.w3.org/ns/shacl#severity', value, null);
	}
});
Object.defineProperty(sh_NodeShape.prototype, 'supershapes', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/ns/shacl#node>', sh_NodeShape);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/ns/shacl#node', values, null);
	}
});
Object.defineProperty(sh_NodeShape.prototype, 'targetClasses', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/ns/shacl#targetClass>', rdfs_Class);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/ns/shacl#targetClass', values, null);
	}
});
Object.defineProperty(sh_NodeShape.prototype, 'targetObjectsOf', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/ns/shacl#targetObjectsOf>', rdf_Property);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/ns/shacl#targetObjectsOf', values, null);
	}
});
Object.defineProperty(sh_NodeShape.prototype, 'targetSubjectsOf', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/ns/shacl#targetSubjectsOf>', rdf_Property);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/ns/shacl#targetSubjectsOf', values, null);
	}
});
Object.defineProperty(sh_NodeShape.prototype, 'types', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>', rdfs_Class);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', values, null);
	}
});

/**
 * Describes the properties of instances of http://www.w3.org/ns/shacl#NodeShape
 * @typedef sh_NodeShape_Props_Int
 * @property {rdfs_Class[]} [applicableToClass] - Links a node shape with the classes that it can be applied to.
 * @property {(LiteralNode|LiteralNode|string)[]} [comments] - The comments of this, possibly in multiple languages.
 * @property {NamedNode[]} [defaultViewForRole] - The user roles that this shape shall be used as default view for.
 * @property {(LiteralNode|string)[]} [labels] - The display name(s) of this, possibly in multiple languages.
 * @property {sh_PropertyShape[]} [properties] - The properties declared for this, using SHACL property shapes.
 * @property {?NamedNode} [severity] - The severity to be used for validation results produced by the constraints.
 * @property {sh_NodeShape[]} [supershapes] - The node shapes that this must also conform to, forming a kind of inheritance between shapes similar to a subclass-of relationship.
 * @property {rdfs_Class[]} [targetClasses] - The types of instances that this shape is targeted at.
 * @property {rdf_Property[]} [targetObjectsOf]
 * @property {rdf_Property[]} [targetSubjectsOf]
 * @property {rdfs_Class[]} [types] - The type(s) of this.
 * @typedef {sh_Shape_Props & sh_NodeShape_Props_Int} sh_NodeShape_Props
 */

/**
 * Generated from the shape http://www.w3.org/ns/shacl#PropertyShape
 */
class sh_PropertyShape extends sh_Shape {

	constructor(obj) {
		super(typeof obj == 'string' ? { uri: obj } : obj);
	}
	
	/**
	 * The type(s) that all values of the property must have.
	 * The RDF path is <http://www.w3.org/ns/shacl#class>
	 * @returns {rdfs_Class[]}
	 */
	get class() {
	}
	
	set class(values) {
	}
	
	/**
	 * Gets an object that can be used to query the reified values for a value of this node.
	 * @param {GraphNode|boolean|number|string} value - the value of this that may have reified values
	 * @return {dash_ConstraintReificationShape}
	 */
	class_dash_ConstraintReificationShape(value) {
		if(value == null || value == undefined) { throw 'Missing value' }
		let reifURI = tosh.reificationURI(this, graph.namedNode('http://www.w3.org/ns/shacl#class'), value);
		return new dash_ConstraintReificationShape(reifURI.uri)
	}
	
	/**
	 * (No sh:description found)
	 * The RDF path is <http://www.w3.org/ns/shacl#closed>
	 * @returns {?boolean | ?LiteralNode}
	 */
	get closed() {
	}
	
	set closed(value) {
	}
	
	/**
	 * Gets an object that can be used to query the reified values for a value of this node.
	 * @param {GraphNode|boolean|number|string} value - the value of this that may have reified values
	 * @return {dash_ConstraintReificationShape}
	 */
	closed_dash_ConstraintReificationShape(value) {
		if(value == null || value == undefined) { throw 'Missing value' }
		let reifURI = tosh.reificationURI(this, graph.namedNode('http://www.w3.org/ns/shacl#closed'), value);
		return new dash_ConstraintReificationShape(reifURI.uri)
	}
	
	/**
	 * The properties that must co-exist with the surrounding property (path). If the surrounding property path has any value then the given property must also have a value, and vice versa.
	 * The RDF path is <http://datashapes.org/dash#coExistsWith>
	 * @returns {NamedNode[]}
	 */
	get coExistsWith() {
	}
	
	set coExistsWith(values) {
	}
	
	/**
	 * Gets an object that can be used to query the reified values for a value of this node.
	 * @param {GraphNode|boolean|number|string} value - the value of this that may have reified values
	 * @return {dash_ConstraintReificationShape}
	 */
	coExistsWith_dash_ConstraintReificationShape(value) {
		if(value == null || value == undefined) { throw 'Missing value' }
		let reifURI = tosh.reificationURI(this, graph.namedNode('http://datashapes.org/dash#coExistsWith'), value);
		return new dash_ConstraintReificationShape(reifURI.uri)
	}
	
	/**
	 * (No sh:description found)
	 * The RDF path is <http://www.w3.org/ns/shacl#datatype>
	 * @returns {?NamedNode}
	 */
	get datatype() {
	}
	
	set datatype(value) {
	}
	
	/**
	 * Gets an object that can be used to query the reified values for a value of this node.
	 * @param {GraphNode|boolean|number|string} value - the value of this that may have reified values
	 * @return {dash_ConstraintReificationShape}
	 */
	datatype_dash_ConstraintReificationShape(value) {
		if(value == null || value == undefined) { throw 'Missing value' }
		let reifURI = tosh.reificationURI(this, graph.namedNode('http://www.w3.org/ns/shacl#datatype'), value);
		return new dash_ConstraintReificationShape(reifURI.uri)
	}
	
	/**
	 * Zero of more datatypes that value nodes can take. In SHACL, the typical pattern is to either use a single sh:datatype or a sh:or of multiple sh:datatype constraints. This inferred property here provides a unified way to access these two design patterns.
	 * The RDF path is <http://topbraid.org/tosh#datatypes>
	 * @returns {NamedNode[]}
	 */
	get datatypes() {
	}
	
	/**
	 * The default value to be used for this property if no other value has been asserted. This may be a constant value or a SHACL node expression, in which case the values can be derived from other values. Default values are typically inferred and not stored as RDF statements.
	 * The RDF path is <http://www.w3.org/ns/shacl#defaultValue>
	 * @returns {(boolean|number|string|LiteralNode|NamedNode)[]}
	 */
	get defaultValue() {
	}
	
	set defaultValue(values) {
	}
	
	/**
	 * The description(s) of the property, possibly in multiple languages.
	 * The RDF path is <http://www.w3.org/ns/shacl#description>
	 * @returns {(LiteralNode|LiteralNode|string)[]}
	 */
	get descriptions() {
	}
	
	set descriptions(values) {
	}
	
	/**
	 * (No sh:description found)
	 * The RDF path is <http://datashapes.org/dash#detailsEndpoint>
	 * @returns {?string | ?LiteralNode}
	 */
	get detailsEndpoint() {
	}
	
	set detailsEndpoint(value) {
	}
	
	/**
	 * Another property that must have disjoint values from this property.
	 * The RDF path is <http://www.w3.org/ns/shacl#disjoint>
	 * @returns {NamedNode[]}
	 */
	get disjoint() {
	}
	
	set disjoint(values) {
	}
	
	/**
	 * Gets an object that can be used to query the reified values for a value of this node.
	 * @param {GraphNode|boolean|number|string} value - the value of this that may have reified values
	 * @return {dash_ConstraintReificationShape}
	 */
	disjoint_dash_ConstraintReificationShape(value) {
		if(value == null || value == undefined) { throw 'Missing value' }
		let reifURI = tosh.reificationURI(this, graph.namedNode('http://www.w3.org/ns/shacl#disjoint'), value);
		return new dash_ConstraintReificationShape(reifURI.uri)
	}
	
	/**
	 * The editor component that should be used to edit values of this property.
	 * The RDF path is <http://datashapes.org/dash#editor>
	 * @returns {?NamedNode}
	 */
	get editor() {
	}
	
	set editor(value) {
	}
	
	/**
	 * Another property that must have the same values as the values of this property.
	 * The RDF path is <http://www.w3.org/ns/shacl#equals>
	 * @returns {NamedNode[]}
	 */
	get equals2() {
	}
	
	set equals2(values) {
	}
	
	/**
	 * Gets an object that can be used to query the reified values for a value of this node.
	 * @param {GraphNode|boolean|number|string} value - the value of this that may have reified values
	 * @return {dash_ConstraintReificationShape}
	 */
	equals2_dash_ConstraintReificationShape(value) {
		if(value == null || value == undefined) { throw 'Missing value' }
		let reifURI = tosh.reificationURI(this, graph.namedNode('http://www.w3.org/ns/shacl#equals'), value);
		return new dash_ConstraintReificationShape(reifURI.uri)
	}
	
	/**
	 * The flags to use for evaluating the sh:pattern regular expressions, e.g. "i" to ignore case.
	 * The RDF path is <http://www.w3.org/ns/shacl#flags>
	 * @returns {?string | ?LiteralNode}
	 */
	get flags() {
	}
	
	set flags(value) {
	}
	
	/**
	 * Gets an object that can be used to query the reified values for a value of this node.
	 * @param {GraphNode|boolean|number|string} value - the value of this that may have reified values
	 * @return {dash_ConstraintReificationShape}
	 */
	flags_dash_ConstraintReificationShape(value) {
		if(value == null || value == undefined) { throw 'Missing value' }
		let reifURI = tosh.reificationURI(this, graph.namedNode('http://www.w3.org/ns/shacl#flags'), value);
		return new dash_ConstraintReificationShape(reifURI.uri)
	}
	
	/**
	 * The group that this property belongs to.
	 * The RDF path is <http://www.w3.org/ns/shacl#group>
	 * @returns {?sh_PropertyGroup}
	 */
	get group() {
	}
	
	set group(value) {
	}
	
	/**
	 * Can be used to verify that one of the value nodes is a given RDF node.
	 * The RDF path is <http://www.w3.org/ns/shacl#hasValue>
	 * @returns {(boolean|number|string|LiteralNode|NamedNode)[]}
	 */
	get hasValue() {
	}
	
	set hasValue(values) {
	}
	
	/**
	 * At least one of the value nodes must be a member of the given list.
	 * The RDF path is <http://datashapes.org/dash#hasValueIn>
	 * @returns {NamedNode[]}
	 */
	get hasValueIn() {
	}
	
	set hasValueIn(values) {
	}
	
	/**
	 * Gets an object that can be used to query the reified values for a value of this node.
	 * @param {GraphNode|boolean|number|string} value - the value of this that may have reified values
	 * @return {dash_ConstraintReificationShape}
	 */
	hasValueIn_dash_ConstraintReificationShape(value) {
		if(value == null || value == undefined) { throw 'Missing value' }
		let reifURI = tosh.reificationURI(this, graph.namedNode('http://datashapes.org/dash#hasValueIn'), value);
		return new dash_ConstraintReificationShape(reifURI.uri)
	}
	
	/**
	 * One of the values of the property path must be an instance of the given class.
	 * The RDF path is <http://datashapes.org/dash#hasValueWithClass>
	 * @returns {rdfs_Class[]}
	 */
	get hasValueWithClass() {
	}
	
	set hasValueWithClass(values) {
	}
	
	/**
	 * Gets an object that can be used to query the reified values for a value of this node.
	 * @param {GraphNode|boolean|number|string} value - the value of this that may have reified values
	 * @return {dash_ConstraintReificationShape}
	 */
	hasValueWithClass_dash_ConstraintReificationShape(value) {
		if(value == null || value == undefined) { throw 'Missing value' }
		let reifURI = tosh.reificationURI(this, graph.namedNode('http://datashapes.org/dash#hasValueWithClass'), value);
		return new dash_ConstraintReificationShape(reifURI.uri)
	}
	
	/**
	 * True to mark this property as hidden in user interface, yet still used in data tasks.
	 * The RDF path is <http://datashapes.org/dash#hidden>
	 * @returns {?boolean | ?LiteralNode}
	 */
	get hidden() {
	}
	
	set hidden(value) {
	}
	
	/**
	 * (No sh:description found)
	 * The RDF path is <http://www.w3.org/ns/shacl#ignoredProperties>
	 * @returns {NamedNode[]}
	 */
	get ignoredProperties() {
	}
	
	set ignoredProperties(values) {
	}
	
	/**
	 * A list of permissible values for the value nodes.
	 * The RDF path is <http://www.w3.org/ns/shacl#in>
	 * @returns {?NamedNode}
	 */
	get in() {
	}
	
	set in(value) {
	}
	
	/**
	 * True to activate indexing for this property.
	 * The RDF path is <http://datashapes.org/dash#indexed>
	 * @returns {?boolean | ?LiteralNode}
	 */
	get indexed() {
	}
	
	set indexed(value) {
	}
	
	/**
	 * Gets an object that can be used to query the reified values for a value of this node.
	 * @param {GraphNode|boolean|number|string} value - the value of this that may have reified values
	 * @return {dash_ConstraintReificationShape}
	 */
	indexed_dash_ConstraintReificationShape(value) {
		if(value == null || value == undefined) { throw 'Missing value' }
		let reifURI = tosh.reificationURI(this, graph.namedNode('http://datashapes.org/dash#indexed'), value);
		return new dash_ConstraintReificationShape(reifURI.uri)
	}
	
	/**
	 * Property shapes that use the inverse of the current property.
	 * The RDF path is <http://topbraid.org/tosh#inverseProperty>
	 * @returns {(boolean|number|string|LiteralNode|NamedNode)[]}
	 */
	get inverseProperty() {
	}
	
	/**
	 * A list of language codes that the values must have.
	 * The RDF path is <http://www.w3.org/ns/shacl#languageIn>
	 * @returns {?NamedNode}
	 */
	get languageIn() {
	}
	
	set languageIn(value) {
	}
	
	/**
	 * Specifies the condition that each value node is smaller than all values the given property at the same resource.
	 * The RDF path is <http://www.w3.org/ns/shacl#lessThan>
	 * @returns {NamedNode[]}
	 */
	get lessThan() {
	}
	
	set lessThan(values) {
	}
	
	/**
	 * Gets an object that can be used to query the reified values for a value of this node.
	 * @param {GraphNode|boolean|number|string} value - the value of this that may have reified values
	 * @return {dash_ConstraintReificationShape}
	 */
	lessThan_dash_ConstraintReificationShape(value) {
		if(value == null || value == undefined) { throw 'Missing value' }
		let reifURI = tosh.reificationURI(this, graph.namedNode('http://www.w3.org/ns/shacl#lessThan'), value);
		return new dash_ConstraintReificationShape(reifURI.uri)
	}
	
	/**
	 * Specifies the condition that each value node is smaller than or equal to all values the given property at the same resource.
	 * The RDF path is <http://www.w3.org/ns/shacl#lessThanOrEquals>
	 * @returns {NamedNode[]}
	 */
	get lessThanOrEquals() {
	}
	
	set lessThanOrEquals(values) {
	}
	
	/**
	 * Gets an object that can be used to query the reified values for a value of this node.
	 * @param {GraphNode|boolean|number|string} value - the value of this that may have reified values
	 * @return {dash_ConstraintReificationShape}
	 */
	lessThanOrEquals_dash_ConstraintReificationShape(value) {
		if(value == null || value == undefined) { throw 'Missing value' }
		let reifURI = tosh.reificationURI(this, graph.namedNode('http://www.w3.org/ns/shacl#lessThanOrEquals'), value);
		return new dash_ConstraintReificationShape(reifURI.uri)
	}
	
	/**
	 * The maximum number of allowed values.
	 * The RDF path is <http://www.w3.org/ns/shacl#maxCount>
	 * @returns {?number | ?LiteralNode}
	 */
	get maxCount() {
	}
	
	set maxCount(value) {
	}
	
	/**
	 * Gets an object that can be used to query the reified values for a value of this node.
	 * @param {GraphNode|boolean|number|string} value - the value of this that may have reified values
	 * @return {dash_ConstraintReificationShape}
	 */
	maxCount_dash_ConstraintReificationShape(value) {
		if(value == null || value == undefined) { throw 'Missing value' }
		let reifURI = tosh.reificationURI(this, graph.namedNode('http://www.w3.org/ns/shacl#maxCount'), value);
		return new dash_ConstraintReificationShape(reifURI.uri)
	}
	
	/**
	 * The maximum exclusive permitted value.
	 * The RDF path is <http://www.w3.org/ns/shacl#maxExclusive>
	 * @returns {?boolean | ?number | ?string | ?LiteralNode | ?NamedNode}
	 */
	get maxExclusive() {
	}
	
	set maxExclusive(value) {
	}
	
	/**
	 * Gets an object that can be used to query the reified values for a value of this node.
	 * @param {GraphNode|boolean|number|string} value - the value of this that may have reified values
	 * @return {dash_ConstraintReificationShape}
	 */
	maxExclusive_dash_ConstraintReificationShape(value) {
		if(value == null || value == undefined) { throw 'Missing value' }
		let reifURI = tosh.reificationURI(this, graph.namedNode('http://www.w3.org/ns/shacl#maxExclusive'), value);
		return new dash_ConstraintReificationShape(reifURI.uri)
	}
	
	/**
	 * The maximum inclusive permitted value.
	 * The RDF path is <http://www.w3.org/ns/shacl#maxInclusive>
	 * @returns {?boolean | ?number | ?string | ?LiteralNode | ?NamedNode}
	 */
	get maxInclusive() {
	}
	
	set maxInclusive(value) {
	}
	
	/**
	 * Gets an object that can be used to query the reified values for a value of this node.
	 * @param {GraphNode|boolean|number|string} value - the value of this that may have reified values
	 * @return {dash_ConstraintReificationShape}
	 */
	maxInclusive_dash_ConstraintReificationShape(value) {
		if(value == null || value == undefined) { throw 'Missing value' }
		let reifURI = tosh.reificationURI(this, graph.namedNode('http://www.w3.org/ns/shacl#maxInclusive'), value);
		return new dash_ConstraintReificationShape(reifURI.uri)
	}
	
	/**
	 * The maximum string length of values.
	 * The RDF path is <http://www.w3.org/ns/shacl#maxLength>
	 * @returns {?number | ?LiteralNode}
	 */
	get maxLength() {
	}
	
	set maxLength(value) {
	}
	
	/**
	 * Gets an object that can be used to query the reified values for a value of this node.
	 * @param {GraphNode|boolean|number|string} value - the value of this that may have reified values
	 * @return {dash_ConstraintReificationShape}
	 */
	maxLength_dash_ConstraintReificationShape(value) {
		if(value == null || value == undefined) { throw 'Missing value' }
		let reifURI = tosh.reificationURI(this, graph.namedNode('http://www.w3.org/ns/shacl#maxLength'), value);
		return new dash_ConstraintReificationShape(reifURI.uri)
	}
	
	/**
	 * The minimum number of required values.
	 * The RDF path is <http://www.w3.org/ns/shacl#minCount>
	 * @returns {?number | ?LiteralNode}
	 */
	get minCount() {
	}
	
	set minCount(value) {
	}
	
	/**
	 * Gets an object that can be used to query the reified values for a value of this node.
	 * @param {GraphNode|boolean|number|string} value - the value of this that may have reified values
	 * @return {dash_ConstraintReificationShape}
	 */
	minCount_dash_ConstraintReificationShape(value) {
		if(value == null || value == undefined) { throw 'Missing value' }
		let reifURI = tosh.reificationURI(this, graph.namedNode('http://www.w3.org/ns/shacl#minCount'), value);
		return new dash_ConstraintReificationShape(reifURI.uri)
	}
	
	/**
	 * The minimum exclusive permitted value.
	 * The RDF path is <http://www.w3.org/ns/shacl#minExclusive>
	 * @returns {?boolean | ?number | ?string | ?LiteralNode | ?NamedNode}
	 */
	get minExclusive() {
	}
	
	set minExclusive(value) {
	}
	
	/**
	 * Gets an object that can be used to query the reified values for a value of this node.
	 * @param {GraphNode|boolean|number|string} value - the value of this that may have reified values
	 * @return {dash_ConstraintReificationShape}
	 */
	minExclusive_dash_ConstraintReificationShape(value) {
		if(value == null || value == undefined) { throw 'Missing value' }
		let reifURI = tosh.reificationURI(this, graph.namedNode('http://www.w3.org/ns/shacl#minExclusive'), value);
		return new dash_ConstraintReificationShape(reifURI.uri)
	}
	
	/**
	 * The minimum inclusive permitted value.
	 * The RDF path is <http://www.w3.org/ns/shacl#minInclusive>
	 * @returns {?boolean | ?number | ?string | ?LiteralNode | ?NamedNode}
	 */
	get minInclusive() {
	}
	
	set minInclusive(value) {
	}
	
	/**
	 * Gets an object that can be used to query the reified values for a value of this node.
	 * @param {GraphNode|boolean|number|string} value - the value of this that may have reified values
	 * @return {dash_ConstraintReificationShape}
	 */
	minInclusive_dash_ConstraintReificationShape(value) {
		if(value == null || value == undefined) { throw 'Missing value' }
		let reifURI = tosh.reificationURI(this, graph.namedNode('http://www.w3.org/ns/shacl#minInclusive'), value);
		return new dash_ConstraintReificationShape(reifURI.uri)
	}
	
	/**
	 * The minimum string length of values.
	 * The RDF path is <http://www.w3.org/ns/shacl#minLength>
	 * @returns {?number | ?LiteralNode}
	 */
	get minLength() {
	}
	
	set minLength(value) {
	}
	
	/**
	 * Gets an object that can be used to query the reified values for a value of this node.
	 * @param {GraphNode|boolean|number|string} value - the value of this that may have reified values
	 * @return {dash_ConstraintReificationShape}
	 */
	minLength_dash_ConstraintReificationShape(value) {
		if(value == null || value == undefined) { throw 'Missing value' }
		let reifURI = tosh.reificationURI(this, graph.namedNode('http://www.w3.org/ns/shacl#minLength'), value);
		return new dash_ConstraintReificationShape(reifURI.uri)
	}
	
	/**
	 * (No sh:description found)
	 * The RDF path is <http://datashapes.org/graphql#name>
	 * @returns {(boolean|number|string|LiteralNode|NamedNode)[]}
	 */
	get name() {
	}
	
	set name(values) {
	}
	
	/**
	 * The display names of the property, possibly in multiple languages.
	 * The RDF path is <http://www.w3.org/ns/shacl#name>
	 * @returns {(LiteralNode|string)[]}
	 */
	get names() {
	}
	
	set names(values) {
	}
	
	/**
	 * (No sh:description found)
	 * The RDF path is <http://datashapes.org/dash#neverMaterialize>
	 * @returns {?boolean | ?LiteralNode}
	 */
	get neverMaterialize() {
	}
	
	set neverMaterialize(value) {
	}
	
	/**
	 * The kind(s) of RDF nodes that are permitted.
	 * The RDF path is <http://www.w3.org/ns/shacl#nodeKind>
	 * @returns {?NamedNode}
	 */
	get nodeKind() {
	}
	
	set nodeKind(value) {
	}
	
	/**
	 * Gets an object that can be used to query the reified values for a value of this node.
	 * @param {GraphNode|boolean|number|string} value - the value of this that may have reified values
	 * @return {dash_ConstraintReificationShape}
	 */
	nodeKind_dash_ConstraintReificationShape(value) {
		if(value == null || value == undefined) { throw 'Missing value' }
		let reifURI = tosh.reificationURI(this, graph.namedNode('http://www.w3.org/ns/shacl#nodeKind'), value);
		return new dash_ConstraintReificationShape(reifURI.uri)
	}
	
	/**
	 * Used to state that a property or path must not point back to itself.
	 * 
	 * For example, "a person cannot have itself as parent" can be expressed by setting dash:nonRecursive=true for a given sh:path.
	 * 
	 * To express that a person cannot have itself among any of its (recursive) parents, use a sh:path with the + operator such as ex:parent+.
	 * The RDF path is <http://datashapes.org/dash#nonRecursive>
	 * @returns {?boolean | ?LiteralNode}
	 */
	get nonRecursive() {
	}
	
	set nonRecursive(value) {
	}
	
	/**
	 * Gets an object that can be used to query the reified values for a value of this node.
	 * @param {GraphNode|boolean|number|string} value - the value of this that may have reified values
	 * @return {dash_ConstraintReificationShape}
	 */
	nonRecursive_dash_ConstraintReificationShape(value) {
		if(value == null || value == undefined) { throw 'Missing value' }
		let reifURI = tosh.reificationURI(this, graph.namedNode('http://datashapes.org/dash#nonRecursive'), value);
		return new dash_ConstraintReificationShape(reifURI.uri)
	}
	
	/**
	 * The shape(s) that the value nodes must not have.
	 * The RDF path is <http://www.w3.org/ns/shacl#not>
	 * @returns {(boolean|number|string|LiteralNode|NamedNode)[]}
	 */
	get not() {
	}
	
	set not(values) {
	}
	
	/**
	 * (No sh:description found)
	 * The RDF path is <http://www.w3.org/ns/shacl#or>
	 * @returns {NamedNode[]}
	 */
	get or() {
	}
	
	set or(values) {
	}
	
	/**
	 * The list of classes that the value nodes may be instances of, using sh:or.
	 * The RDF path is <http://topbraid.org/tosh#orClasses>
	 * @returns {NamedNode[]}
	 */
	get orClasses() {
	}
	
	/**
	 * The relative order of this property shape compared to others.
	 * The RDF path is <http://www.w3.org/ns/shacl#order>
	 * @returns {?number | ?LiteralNode}
	 */
	get order() {
	}
	
	set order(value) {
	}
	
	/**
	 * (No sh:description found)
	 * The RDF path is <http://www.w3.org/ns/shacl#path>
	 * @returns {?NamedNode}
	 */
	get path() {
	}
	
	set path(value) {
	}
	
	/**
	 * A display label of the sh:path based on qnames.
	 * The RDF path is <http://topbraid.org/tosh#pathSystemLabel>
	 * @returns {?string}
	 */
	get pathSystemLabel() {
	}
	
	/**
	 * The regular expression that the values need to fulfill.
	 * The RDF path is <http://www.w3.org/ns/shacl#pattern>
	 * @returns {?string | ?LiteralNode}
	 */
	get pattern() {
	}
	
	set pattern(value) {
	}
	
	/**
	 * Gets an object that can be used to query the reified values for a value of this node.
	 * @param {GraphNode|boolean|number|string} value - the value of this that may have reified values
	 * @return {dash_ConstraintReificationShape}
	 */
	pattern_dash_ConstraintReificationShape(value) {
		if(value == null || value == undefined) { throw 'Missing value' }
		let reifURI = tosh.reificationURI(this, graph.namedNode('http://www.w3.org/ns/shacl#pattern'), value);
		return new dash_ConstraintReificationShape(reifURI.uri)
	}
	
	/**
	 * (No sh:description found)
	 * The RDF path is <http://datashapes.org/dash#propertyRole>
	 * @returns {?NamedNode}
	 */
	get propertyRole() {
	}
	
	set propertyRole(value) {
	}
	
	/**
	 * If set to true then the values of this property should not be editable in the user interface. Note that low-level access such as source code editors may still allow editing, but form-based editors would not.
	 * 
	 * More generally, the values of this property are SHACL node expressions, e.g. function calls, in which case the property counts as read-only if the expression evaluates to true.
	 * The RDF path is <http://datashapes.org/dash#readOnly>
	 * @returns {?boolean | ?LiteralNode}
	 */
	get readOnly() {
	}
	
	set readOnly(value) {
	}
	
	/**
	 * Can be used to specify the node shape that may be applied to reified statements produced by a property shape. The property shape must have a URI resource as its sh:path. The values of this property must be node shapes. User interfaces can use this information to determine which properties to present to users when reified statements are explored or edited. Also, SHACL validators can use it to determine how to validate reified triples. Use dash:None to indicate that no reification should be permitted.
	 * The RDF path is <http://datashapes.org/dash#reifiableBy>
	 * @returns {?sh_NodeShape}
	 */
	get reifiableBy() {
	}
	
	set reifiableBy(value) {
	}
	
	/**
	 * If set to true then the value must have a reification object with at least one property.
	 * The RDF path is <http://datashapes.org/dash#reificationRequired>
	 * @returns {?boolean | ?LiteralNode}
	 */
	get reificationRequired() {
	}
	
	set reificationRequired(value) {
	}
	
	/**
	 * The root class.
	 * The RDF path is <http://datashapes.org/dash#rootClass>
	 * @returns {rdfs_Class[]}
	 */
	get rootClass() {
	}
	
	set rootClass(values) {
	}
	
	/**
	 * Gets an object that can be used to query the reified values for a value of this node.
	 * @param {GraphNode|boolean|number|string} value - the value of this that may have reified values
	 * @return {dash_ConstraintReificationShape}
	 */
	rootClass_dash_ConstraintReificationShape(value) {
		if(value == null || value == undefined) { throw 'Missing value' }
		let reifURI = tosh.reificationURI(this, graph.namedNode('http://datashapes.org/dash#rootClass'), value);
		return new dash_ConstraintReificationShape(reifURI.uri)
	}
	
	/**
	 * True to state that the lexical form of literal value nodes must not contain any line breaks. False to state that line breaks are explicitly permitted.
	 * The RDF path is <http://datashapes.org/dash#singleLine>
	 * @returns {?boolean | ?LiteralNode}
	 */
	get singleLine() {
	}
	
	set singleLine(value) {
	}
	
	/**
	 * Gets an object that can be used to query the reified values for a value of this node.
	 * @param {GraphNode|boolean|number|string} value - the value of this that may have reified values
	 * @return {dash_ConstraintReificationShape}
	 */
	singleLine_dash_ConstraintReificationShape(value) {
		if(value == null || value == undefined) { throw 'Missing value' }
		let reifURI = tosh.reificationURI(this, graph.namedNode('http://datashapes.org/dash#singleLine'), value);
		return new dash_ConstraintReificationShape(reifURI.uri)
	}
	
	/**
	 * Enable the spellchecker for the specified languages. Currently supports en,nl,de,it,es,fr,pt. Five character locales like 'en-us' are also supported. A '*' value means to check all supported languages.
	 * The RDF path is <http://topbraid.org/tosh#spellCheckLang>
	 * @returns {(string|LiteralNode)[]}
	 */
	get spellCheckLang() {
	}
	
	set spellCheckLang(values) {
	}
	
	/**
	 * If specified then every value node must be an IRI and the IRI must start with the given string value.
	 * The RDF path is <http://datashapes.org/dash#stem>
	 * @returns {?string | ?LiteralNode}
	 */
	get stem() {
	}
	
	set stem(value) {
	}
	
	/**
	 * Gets an object that can be used to query the reified values for a value of this node.
	 * @param {GraphNode|boolean|number|string} value - the value of this that may have reified values
	 * @return {dash_ConstraintReificationShape}
	 */
	stem_dash_ConstraintReificationShape(value) {
		if(value == null || value == undefined) { throw 'Missing value' }
		let reifURI = tosh.reificationURI(this, graph.namedNode('http://datashapes.org/dash#stem'), value);
		return new dash_ConstraintReificationShape(reifURI.uri)
	}
	
	/**
	 * Can be used to state that all value nodes must also be values of a specified other property at the same focus node.
	 * The RDF path is <http://datashapes.org/dash#subSetOf>
	 * @returns {NamedNode[]}
	 */
	get subSetOf() {
	}
	
	set subSetOf(values) {
	}
	
	/**
	 * Gets an object that can be used to query the reified values for a value of this node.
	 * @param {GraphNode|boolean|number|string} value - the value of this that may have reified values
	 * @return {dash_ConstraintReificationShape}
	 */
	subSetOf_dash_ConstraintReificationShape(value) {
		if(value == null || value == undefined) { throw 'Missing value' }
		let reifURI = tosh.reificationURI(this, graph.namedNode('http://datashapes.org/dash#subSetOf'), value);
		return new dash_ConstraintReificationShape(reifURI.uri)
	}
	
	/**
	 * If set to true then if A relates to B then B must relate to A.
	 * The RDF path is <http://datashapes.org/dash#symmetric>
	 * @returns {?boolean | ?LiteralNode}
	 */
	get symmetric() {
	}
	
	set symmetric(value) {
	}
	
	/**
	 * Gets an object that can be used to query the reified values for a value of this node.
	 * @param {GraphNode|boolean|number|string} value - the value of this that may have reified values
	 * @return {dash_ConstraintReificationShape}
	 */
	symmetric_dash_ConstraintReificationShape(value) {
		if(value == null || value == undefined) { throw 'Missing value' }
		let reifURI = tosh.reificationURI(this, graph.namedNode('http://datashapes.org/dash#symmetric'), value);
		return new dash_ConstraintReificationShape(reifURI.uri)
	}
	
	/**
	 * True to make sure that all value have distinct language tags.
	 * The RDF path is <http://www.w3.org/ns/shacl#uniqueLang>
	 * @returns {?boolean | ?LiteralNode}
	 */
	get uniqueLang() {
	}
	
	set uniqueLang(value) {
	}
	
	/**
	 * Gets an object that can be used to query the reified values for a value of this node.
	 * @param {GraphNode|boolean|number|string} value - the value of this that may have reified values
	 * @return {dash_ConstraintReificationShape}
	 */
	uniqueLang_dash_ConstraintReificationShape(value) {
		if(value == null || value == undefined) { throw 'Missing value' }
		let reifURI = tosh.reificationURI(this, graph.namedNode('http://www.w3.org/ns/shacl#uniqueLang'), value);
		return new dash_ConstraintReificationShape(reifURI.uri)
	}
	
	/**
	 * States that the values of the property must be unique for all instances of a given class (and its subclasses).
	 * The RDF path is <http://datashapes.org/dash#uniqueValueForClass>
	 * @returns {rdfs_Class[]}
	 */
	get uniqueValueForClass() {
	}
	
	set uniqueValueForClass(values) {
	}
	
	/**
	 * Gets an object that can be used to query the reified values for a value of this node.
	 * @param {GraphNode|boolean|number|string} value - the value of this that may have reified values
	 * @return {dash_ConstraintReificationShape}
	 */
	uniqueValueForClass_dash_ConstraintReificationShape(value) {
		if(value == null || value == undefined) { throw 'Missing value' }
		let reifURI = tosh.reificationURI(this, graph.namedNode('http://datashapes.org/dash#uniqueValueForClass'), value);
		return new dash_ConstraintReificationShape(reifURI.uri)
	}
	
	/**
	 * The start of the URIs of well-formed resources. If specified then the associated property/path serves as "primary key" for all target nodes (instances). All such target nodes need to have a URI that starts with the given string, followed by the URI-encoded value of the primary key property.
	 * The RDF path is <http://datashapes.org/dash#uriStart>
	 * @returns {?string | ?LiteralNode}
	 */
	get uriStart() {
	}
	
	set uriStart(value) {
	}
	
	/**
	 * Gets an object that can be used to query the reified values for a value of this node.
	 * @param {GraphNode|boolean|number|string} value - the value of this that may have reified values
	 * @return {dash_ConstraintReificationShape}
	 */
	uriStart_dash_ConstraintReificationShape(value) {
		if(value == null || value == undefined) { throw 'Missing value' }
		let reifURI = tosh.reificationURI(this, graph.namedNode('http://datashapes.org/dash#uriStart'), value);
		return new dash_ConstraintReificationShape(reifURI.uri)
	}
	
	/**
	 * (No sh:description found)
	 * The RDF path is <http://www.w3.org/ns/shacl#values>
	 * @returns {(boolean|number|string|LiteralNode|NamedNode)[]}
	 */
	get values2() {
	}
	
	set values2(values) {
	}
	
	/**
	 * The viewer component that should be used to render values of this property.
	 * The RDF path is <http://datashapes.org/dash#viewer>
	 * @returns {?NamedNode}
	 */
	get viewer() {
	}
	
	set viewer(value) {
	}
	
	/**
	 * (No sh:description found)
	 * The RDF path is <http://www.w3.org/ns/shacl#xone>
	 * @returns {NamedNode[]}
	 */
	get xone() {
	}
	
	set xone(values) {
	}
}
GraphNodeUtil.classes['sh_PropertyShape'] = sh_PropertyShape;
Object.defineProperty(sh_PropertyShape.prototype, 'class', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/ns/shacl#class>', rdfs_Class);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/ns/shacl#class', values, null);
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'closed', {
	enumerable: true,
	get() {
		return this.value('<http://www.w3.org/ns/shacl#closed>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://www.w3.org/ns/shacl#closed', value, 'http://www.w3.org/2001/XMLSchema#boolean');
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'coExistsWith', {
	enumerable: true,
	get() {
		return this.values('<http://datashapes.org/dash#coExistsWith>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://datashapes.org/dash#coExistsWith', values, null);
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'datatype', {
	enumerable: true,
	get() {
		return this.value('<http://www.w3.org/ns/shacl#datatype>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://www.w3.org/ns/shacl#datatype', value, null);
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'datatypes', {
	enumerable: true,
	get() {
		return this.values('<http://topbraid.org/tosh#datatypes>', null);
	},
});
Object.defineProperty(sh_PropertyShape.prototype, 'defaultValue', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/ns/shacl#defaultValue>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/ns/shacl#defaultValue', values, null);
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'descriptions', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/ns/shacl#description>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/ns/shacl#description', values, null);
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'detailsEndpoint', {
	enumerable: true,
	get() {
		return this.value('<http://datashapes.org/dash#detailsEndpoint>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://datashapes.org/dash#detailsEndpoint', value, 'http://www.w3.org/2001/XMLSchema#string');
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'disjoint', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/ns/shacl#disjoint>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/ns/shacl#disjoint', values, null);
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'editor', {
	enumerable: true,
	get() {
		return this.value('<http://datashapes.org/dash#editor>', NamedNode);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://datashapes.org/dash#editor', value, null);
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'equals2', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/ns/shacl#equals>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/ns/shacl#equals', values, null);
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'flags', {
	enumerable: true,
	get() {
		return this.value('<http://www.w3.org/ns/shacl#flags>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://www.w3.org/ns/shacl#flags', value, 'http://www.w3.org/2001/XMLSchema#string');
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'group', {
	enumerable: true,
	get() {
		return this.value('<http://www.w3.org/ns/shacl#group>', sh_PropertyGroup);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://www.w3.org/ns/shacl#group', value, null);
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'hasValue', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/ns/shacl#hasValue>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/ns/shacl#hasValue', values, null);
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'hasValueIn', {
	enumerable: true,
	get() {
		return this.values('<http://datashapes.org/dash#hasValueIn>', NamedNode);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://datashapes.org/dash#hasValueIn', values, null);
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'hasValueWithClass', {
	enumerable: true,
	get() {
		return this.values('<http://datashapes.org/dash#hasValueWithClass>', rdfs_Class);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://datashapes.org/dash#hasValueWithClass', values, null);
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'hidden', {
	enumerable: true,
	get() {
		return this.value('<http://datashapes.org/dash#hidden>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://datashapes.org/dash#hidden', value, 'http://www.w3.org/2001/XMLSchema#boolean');
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'ignoredProperties', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/ns/shacl#ignoredProperties>', NamedNode);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/ns/shacl#ignoredProperties', values, null);
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'in', {
	enumerable: true,
	get() {
		return this.value('<http://www.w3.org/ns/shacl#in>', NamedNode);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://www.w3.org/ns/shacl#in', value, null);
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'indexed', {
	enumerable: true,
	get() {
		return this.value('<http://datashapes.org/dash#indexed>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://datashapes.org/dash#indexed', value, 'http://www.w3.org/2001/XMLSchema#boolean');
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'inverseProperty', {
	enumerable: true,
	get() {
		return this.values('<http://topbraid.org/tosh#inverseProperty>', null);
	},
});
Object.defineProperty(sh_PropertyShape.prototype, 'languageIn', {
	enumerable: true,
	get() {
		return this.value('<http://www.w3.org/ns/shacl#languageIn>', NamedNode);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://www.w3.org/ns/shacl#languageIn', value, null);
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'lessThan', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/ns/shacl#lessThan>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/ns/shacl#lessThan', values, null);
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'lessThanOrEquals', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/ns/shacl#lessThanOrEquals>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/ns/shacl#lessThanOrEquals', values, null);
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'maxCount', {
	enumerable: true,
	get() {
		return this.value('<http://www.w3.org/ns/shacl#maxCount>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://www.w3.org/ns/shacl#maxCount', value, 'http://www.w3.org/2001/XMLSchema#integer');
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'maxExclusive', {
	enumerable: true,
	get() {
		return this.value('<http://www.w3.org/ns/shacl#maxExclusive>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://www.w3.org/ns/shacl#maxExclusive', value, null);
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'maxInclusive', {
	enumerable: true,
	get() {
		return this.value('<http://www.w3.org/ns/shacl#maxInclusive>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://www.w3.org/ns/shacl#maxInclusive', value, null);
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'maxLength', {
	enumerable: true,
	get() {
		return this.value('<http://www.w3.org/ns/shacl#maxLength>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://www.w3.org/ns/shacl#maxLength', value, 'http://www.w3.org/2001/XMLSchema#integer');
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'minCount', {
	enumerable: true,
	get() {
		return this.value('<http://www.w3.org/ns/shacl#minCount>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://www.w3.org/ns/shacl#minCount', value, 'http://www.w3.org/2001/XMLSchema#integer');
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'minExclusive', {
	enumerable: true,
	get() {
		return this.value('<http://www.w3.org/ns/shacl#minExclusive>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://www.w3.org/ns/shacl#minExclusive', value, null);
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'minInclusive', {
	enumerable: true,
	get() {
		return this.value('<http://www.w3.org/ns/shacl#minInclusive>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://www.w3.org/ns/shacl#minInclusive', value, null);
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'minLength', {
	enumerable: true,
	get() {
		return this.value('<http://www.w3.org/ns/shacl#minLength>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://www.w3.org/ns/shacl#minLength', value, 'http://www.w3.org/2001/XMLSchema#integer');
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'name', {
	enumerable: true,
	get() {
		return this.values('<http://datashapes.org/graphql#name>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://datashapes.org/graphql#name', values, null);
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'names', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/ns/shacl#name>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/ns/shacl#name', values, null);
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'neverMaterialize', {
	enumerable: true,
	get() {
		return this.value('<http://datashapes.org/dash#neverMaterialize>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://datashapes.org/dash#neverMaterialize', value, 'http://www.w3.org/2001/XMLSchema#boolean');
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'nodeKind', {
	enumerable: true,
	get() {
		return this.value('<http://www.w3.org/ns/shacl#nodeKind>', NamedNode);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://www.w3.org/ns/shacl#nodeKind', value, null);
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'nonRecursive', {
	enumerable: true,
	get() {
		return this.value('<http://datashapes.org/dash#nonRecursive>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://datashapes.org/dash#nonRecursive', value, 'http://www.w3.org/2001/XMLSchema#boolean');
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'not', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/ns/shacl#not>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/ns/shacl#not', values, null);
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'or', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/ns/shacl#or>', NamedNode);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/ns/shacl#or', values, null);
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'orClasses', {
	enumerable: true,
	get() {
		return this.values('<http://topbraid.org/tosh#orClasses>', null);
	},
});
Object.defineProperty(sh_PropertyShape.prototype, 'order', {
	enumerable: true,
	get() {
		return this.value('<http://www.w3.org/ns/shacl#order>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://www.w3.org/ns/shacl#order', value, null);
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'path', {
	enumerable: true,
	get() {
		return this.value('<http://www.w3.org/ns/shacl#path>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://www.w3.org/ns/shacl#path', value, null);
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'pathSystemLabel', {
	enumerable: true,
	get() {
		return this.value('<http://topbraid.org/tosh#pathSystemLabel>', null);
	},
});
Object.defineProperty(sh_PropertyShape.prototype, 'pattern', {
	enumerable: true,
	get() {
		return this.value('<http://www.w3.org/ns/shacl#pattern>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://www.w3.org/ns/shacl#pattern', value, 'http://www.w3.org/2001/XMLSchema#string');
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'propertyRole', {
	enumerable: true,
	get() {
		return this.value('<http://datashapes.org/dash#propertyRole>', NamedNode);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://datashapes.org/dash#propertyRole', value, null);
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'readOnly', {
	enumerable: true,
	get() {
		return this.value('<http://datashapes.org/dash#readOnly>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://datashapes.org/dash#readOnly', value, 'http://www.w3.org/2001/XMLSchema#boolean');
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'reifiableBy', {
	enumerable: true,
	get() {
		return this.value('<http://datashapes.org/dash#reifiableBy>', sh_NodeShape);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://datashapes.org/dash#reifiableBy', value, null);
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'reificationRequired', {
	enumerable: true,
	get() {
		return this.value('<http://datashapes.org/dash#reificationRequired>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://datashapes.org/dash#reificationRequired', value, 'http://www.w3.org/2001/XMLSchema#boolean');
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'rootClass', {
	enumerable: true,
	get() {
		return this.values('<http://datashapes.org/dash#rootClass>', rdfs_Class);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://datashapes.org/dash#rootClass', values, null);
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'singleLine', {
	enumerable: true,
	get() {
		return this.value('<http://datashapes.org/dash#singleLine>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://datashapes.org/dash#singleLine', value, 'http://www.w3.org/2001/XMLSchema#boolean');
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'spellCheckLang', {
	enumerable: true,
	get() {
		return this.values('<http://topbraid.org/tosh#spellCheckLang>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://topbraid.org/tosh#spellCheckLang', values, 'http://www.w3.org/2001/XMLSchema#string');
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'stem', {
	enumerable: true,
	get() {
		return this.value('<http://datashapes.org/dash#stem>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://datashapes.org/dash#stem', value, 'http://www.w3.org/2001/XMLSchema#string');
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'subSetOf', {
	enumerable: true,
	get() {
		return this.values('<http://datashapes.org/dash#subSetOf>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://datashapes.org/dash#subSetOf', values, null);
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'symmetric', {
	enumerable: true,
	get() {
		return this.value('<http://datashapes.org/dash#symmetric>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://datashapes.org/dash#symmetric', value, 'http://www.w3.org/2001/XMLSchema#boolean');
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'uniqueLang', {
	enumerable: true,
	get() {
		return this.value('<http://www.w3.org/ns/shacl#uniqueLang>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://www.w3.org/ns/shacl#uniqueLang', value, 'http://www.w3.org/2001/XMLSchema#boolean');
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'uniqueValueForClass', {
	enumerable: true,
	get() {
		return this.values('<http://datashapes.org/dash#uniqueValueForClass>', rdfs_Class);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://datashapes.org/dash#uniqueValueForClass', values, null);
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'uriStart', {
	enumerable: true,
	get() {
		return this.value('<http://datashapes.org/dash#uriStart>', null);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://datashapes.org/dash#uriStart', value, 'http://www.w3.org/2001/XMLSchema#string');
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'values2', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/ns/shacl#values>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/ns/shacl#values', values, null);
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'viewer', {
	enumerable: true,
	get() {
		return this.value('<http://datashapes.org/dash#viewer>', NamedNode);
	},
	set(value) {
		__jenaData.setPropertyValue(this.zzzJenaNode, 'http://datashapes.org/dash#viewer', value, null);
	}
});
Object.defineProperty(sh_PropertyShape.prototype, 'xone', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/ns/shacl#xone>', NamedNode);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/ns/shacl#xone', values, null);
	}
});

/**
 * Describes the properties of instances of http://www.w3.org/ns/shacl#PropertyShape
 * @typedef sh_PropertyShape_Props_Int
 * @property {rdfs_Class[]} [class] - The type(s) that all values of the property must have.
 * @property {?boolean | ?LiteralNode} [closed]
 * @property {NamedNode[]} [coExistsWith] - The properties that must co-exist with the surrounding property (path). If the surrounding property path has any value then the given property must also have a value, and vice versa.
 * @property {?NamedNode} [datatype]
 * @property {(boolean|number|string|LiteralNode|NamedNode)[]} [defaultValue] - The default value to be used for this property if no other value has been asserted. This may be a constant value or a SHACL node expression, in which case the values can be derived from other values. Default values are typically inferred and not stored as RDF statements.
 * @property {(LiteralNode|LiteralNode|string)[]} [descriptions] - The description(s) of the property, possibly in multiple languages.
 * @property {?string | ?LiteralNode} [detailsEndpoint]
 * @property {NamedNode[]} [disjoint] - Another property that must have disjoint values from this property.
 * @property {?NamedNode} [editor] - The editor component that should be used to edit values of this property.
 * @property {NamedNode[]} [equals2] - Another property that must have the same values as the values of this property.
 * @property {?string | ?LiteralNode} [flags] - The flags to use for evaluating the sh:pattern regular expressions, e.g. "i" to ignore case.
 * @property {?sh_PropertyGroup} [group] - The group that this property belongs to.
 * @property {(boolean|number|string|LiteralNode|NamedNode)[]} [hasValue] - Can be used to verify that one of the value nodes is a given RDF node.
 * @property {NamedNode[]} [hasValueIn] - At least one of the value nodes must be a member of the given list.
 * @property {rdfs_Class[]} [hasValueWithClass] - One of the values of the property path must be an instance of the given class.
 * @property {?boolean | ?LiteralNode} [hidden] - True to mark this property as hidden in user interface, yet still used in data tasks.
 * @property {NamedNode[]} [ignoredProperties]
 * @property {?NamedNode} [in] - A list of permissible values for the value nodes.
 * @property {?boolean | ?LiteralNode} [indexed] - True to activate indexing for this property.
 * @property {?NamedNode} [languageIn] - A list of language codes that the values must have.
 * @property {NamedNode[]} [lessThan] - Specifies the condition that each value node is smaller than all values the given property at the same resource.
 * @property {NamedNode[]} [lessThanOrEquals] - Specifies the condition that each value node is smaller than or equal to all values the given property at the same resource.
 * @property {?number | ?LiteralNode} [maxCount] - The maximum number of allowed values.
 * @property {?boolean | ?number | ?string | ?LiteralNode | ?NamedNode} [maxExclusive] - The maximum exclusive permitted value.
 * @property {?boolean | ?number | ?string | ?LiteralNode | ?NamedNode} [maxInclusive] - The maximum inclusive permitted value.
 * @property {?number | ?LiteralNode} [maxLength] - The maximum string length of values.
 * @property {?number | ?LiteralNode} [minCount] - The minimum number of required values.
 * @property {?boolean | ?number | ?string | ?LiteralNode | ?NamedNode} [minExclusive] - The minimum exclusive permitted value.
 * @property {?boolean | ?number | ?string | ?LiteralNode | ?NamedNode} [minInclusive] - The minimum inclusive permitted value.
 * @property {?number | ?LiteralNode} [minLength] - The minimum string length of values.
 * @property {(boolean|number|string|LiteralNode|NamedNode)[]} [name]
 * @property {(LiteralNode|string)[]} [names] - The display names of the property, possibly in multiple languages.
 * @property {?boolean | ?LiteralNode} [neverMaterialize]
 * @property {?NamedNode} [nodeKind] - The kind(s) of RDF nodes that are permitted.
 * @property {?boolean | ?LiteralNode} [nonRecursive] - Used to state that a property or path must not point back to itself.
 *   
 *   For example, "a person cannot have itself as parent" can be expressed by setting dash:nonRecursive=true for a given sh:path.
 *   
 *   To express that a person cannot have itself among any of its (recursive) parents, use a sh:path with the + operator such as ex:parent+.
 * @property {(boolean|number|string|LiteralNode|NamedNode)[]} [not] - The shape(s) that the value nodes must not have.
 * @property {NamedNode[]} [or]
 * @property {?number | ?LiteralNode} [order] - The relative order of this property shape compared to others.
 * @property {?NamedNode} [path]
 * @property {?string | ?LiteralNode} [pattern] - The regular expression that the values need to fulfill.
 * @property {?NamedNode} [propertyRole]
 * @property {?boolean | ?LiteralNode} [readOnly] - If set to true then the values of this property should not be editable in the user interface. Note that low-level access such as source code editors may still allow editing, but form-based editors would not.
 *   
 *   More generally, the values of this property are SHACL node expressions, e.g. function calls, in which case the property counts as read-only if the expression evaluates to true.
 * @property {?sh_NodeShape} [reifiableBy] - Can be used to specify the node shape that may be applied to reified statements produced by a property shape. The property shape must have a URI resource as its sh:path. The values of this property must be node shapes. User interfaces can use this information to determine which properties to present to users when reified statements are explored or edited. Also, SHACL validators can use it to determine how to validate reified triples. Use dash:None to indicate that no reification should be permitted.
 * @property {?boolean | ?LiteralNode} [reificationRequired] - If set to true then the value must have a reification object with at least one property.
 * @property {rdfs_Class[]} [rootClass] - The root class.
 * @property {?boolean | ?LiteralNode} [singleLine] - True to state that the lexical form of literal value nodes must not contain any line breaks. False to state that line breaks are explicitly permitted.
 * @property {(string|LiteralNode)[]} [spellCheckLang] - Enable the spellchecker for the specified languages. Currently supports en,nl,de,it,es,fr,pt. Five character locales like 'en-us' are also supported. A '*' value means to check all supported languages.
 * @property {?string | ?LiteralNode} [stem] - If specified then every value node must be an IRI and the IRI must start with the given string value.
 * @property {NamedNode[]} [subSetOf] - Can be used to state that all value nodes must also be values of a specified other property at the same focus node.
 * @property {?boolean | ?LiteralNode} [symmetric] - If set to true then if A relates to B then B must relate to A.
 * @property {?boolean | ?LiteralNode} [uniqueLang] - True to make sure that all value have distinct language tags.
 * @property {rdfs_Class[]} [uniqueValueForClass] - States that the values of the property must be unique for all instances of a given class (and its subclasses).
 * @property {?string | ?LiteralNode} [uriStart] - The start of the URIs of well-formed resources. If specified then the associated property/path serves as "primary key" for all target nodes (instances). All such target nodes need to have a URI that starts with the given string, followed by the URI-encoded value of the primary key property.
 * @property {(boolean|number|string|LiteralNode|NamedNode)[]} [values2]
 * @property {?NamedNode} [viewer] - The viewer component that should be used to render values of this property.
 * @property {NamedNode[]} [xone]
 * @typedef {sh_Shape_Props & sh_PropertyShape_Props_Int} sh_PropertyShape_Props
 */

/**
 * Generated from the shape http://www.w3.org/2004/02/skos/core#OrderedCollection
 */
class skos_OrderedCollection extends skos_Collection {

	constructor(obj) {
		super(typeof obj == 'string' ? { uri: obj } : obj);
	}
	
	/**
	 * Relates an ordered collection to the RDF list containing its members.
	 * The RDF path is <http://www.w3.org/2004/02/skos/core#memberList>
	 * @returns {(boolean|number|string|LiteralNode|NamedNode)[]}
	 */
	get memberList() {
	}
	
	set memberList(values) {
	}
}
GraphNodeUtil.classes['skos_OrderedCollection'] = skos_OrderedCollection;
Object.defineProperty(skos_OrderedCollection.prototype, 'memberList', {
	enumerable: true,
	get() {
		return this.values('<http://www.w3.org/2004/02/skos/core#memberList>', null);
	},
	set(values) {
		__jenaData[Array.isArray(values) ? 'setPropertyValues' : 'setPropertyValue'](this.zzzJenaNode, 'http://www.w3.org/2004/02/skos/core#memberList', values, null);
	}
});

/**
 * Describes the properties of instances of http://www.w3.org/2004/02/skos/core#OrderedCollection
 * @typedef skos_OrderedCollection_Props_Int
 * @property {(boolean|number|string|LiteralNode|NamedNode)[]} [memberList] - Relates an ordered collection to the RDF list containing its members.
 * @typedef {skos_Collection_Props & skos_OrderedCollection_Props_Int} skos_OrderedCollection_Props
 */

/**
 * Generated from the shape http://www.w3.org/ns/shacl#Parameter
 */
class sh_Parameter extends sh_PropertyShape {

	constructor(obj) {
		super(typeof obj == 'string' ? { uri: obj } : obj);
	}
}
GraphNodeUtil.classes['sh_Parameter'] = sh_Parameter;

/**
 * Describes the properties of instances of http://www.w3.org/ns/shacl#Parameter
 * @typedef sh_Parameter_Props_Int
 * @typedef {sh_PropertyShape_Props & sh_Parameter_Props_Int} sh_Parameter_Props
 */




const SHAPES_GRAPH_ID = 'ssg-skos';

const { Worker, MessageChannel, receiveMessageOnPort } = require('worker_threads');

const { port1, port2 } = new MessageChannel();

/**
 * @typedef {Object} TopBraidInitParams
 * @property {string} serverURL - the URL of the server to use
 * @property {string} dataGraphId - the id of the data graph, e.g. 'geo' or 'geo.myWorkflow'
 * @property {string[]} [langs] - an optional array of preferred language codes (e.g. ['en', 'de'])
 * @property {?Object} [requestConfig] - the config object to send with each POST request, see
 *        https://www.npmjs.com/package/axios#request-config (in particular see the 'auth' field).
 * @property {boolean} [streaming] - true to activate streaming mode, in which edits are added to the database
 *        whenever a certain number of triples has been collected.  By default (false) all changes are first
 *        collected in a diff graph and only written to the database on TopBraid.terminate().
 *        Streaming mode is not supported against working copies.
 * @property {boolean} [readsDoNotDependOnWrites] - set to true if the query/read operations do not need to return
 *        results based on statements that are created as part of this session.  The request engine uses a local
 *        cache to collect all write operations so that they can be sent to TopBraid in as few operations as possible.
 *        By default (if this option is false), any read operation will flush this cache so that TopBraid can "see"
 *        all new statements.  If this option is true, the cache will not be flushed before each read operations.
 */

/**
 * Manages the interaction between external ADS scripts and TopBraid.
 * Any external ADS script should start with calling TopBraid.init().
 */
export const TopBraid = {

    /**
     * Tells the TopBraid ADS system what server and data graph to use.
     * @param {TopBraidInitParams} data - the initialization data
     */
    init(data) {
        if(this.inited) {
            throw 'TopBraid.init() can only be called once';
        }
        this.inited = true;
        let serverURL = data.serverURL;
        if(serverURL.charAt(serverURL.length - 1) != '/') {
            serverURL += '/';
        }
        requestEngine.serverURL = serverURL;
        requestEngine.dataGraphId = data.dataGraphId;
        requestEngine.langs = data.langs;
        requestEngine.streaming = !!data.streaming;
        requestEngine.readsDoNotDependOnWrites = !!data.readsDoNotDependOnWrites;
        requestEngine.config = data.requestConfig;
    },

    /**
     * Installs a given function on the server and returns a proxy function with the same signature.
     * This proxy function can then be used instead of the original function, yet will be executed on
     * the server.
     * 
     * Example usage:
     * 
     *      var findConcept = (label: string): skos_Concept {
     *          return ...
     *      }
     *      myFunction = TopBraid.installFunction(findConcept);
     * 
     *      let concept = findConcept('Test');
     * 
     * @function
     * @template A
     * @param {A} fun - the function to install
     * @returns {A} a proxy function for fun
     */
     installFunction(fun) {
        let src = fun.toString();
        let moduleName = SHAPES_GRAPH_ID + '_ADS_generated_node_';
        for(let i = 1; src.includes(moduleName + i); i++) {
            let re = new RegExp(moduleName + i + '\\.', 'g');
            src = src.replace(re, '');
        }
        let paramNames = installFunctionHelper(src);
        requestEngine.request('installFunction', {
            name: fun.name,
            paramNames: paramNames,
            src: src
        })
        // Cannot use arguments[i] here because those are from surrounding function
        return (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) => {
            let bindings = {};
            let expr = fun.name + '(' + paramNames.join(', ') + ')';
            if(paramNames.length > 0) { bindings[paramNames[0]] = GraphNodeUtil.flattenGraphNodes(arg0) }
            if(paramNames.length > 1) { bindings[paramNames[1]] = GraphNodeUtil.flattenGraphNodes(arg1) }
            if(paramNames.length > 2) { bindings[paramNames[2]] = GraphNodeUtil.flattenGraphNodes(arg2) }
            if(paramNames.length > 3) { bindings[paramNames[3]] = GraphNodeUtil.flattenGraphNodes(arg3) }
            if(paramNames.length > 4) { bindings[paramNames[4]] = GraphNodeUtil.flattenGraphNodes(arg4) }
            if(paramNames.length > 5) { bindings[paramNames[5]] = GraphNodeUtil.flattenGraphNodes(arg5) }
            if(paramNames.length > 6) { bindings[paramNames[6]] = GraphNodeUtil.flattenGraphNodes(arg6) }
            if(paramNames.length > 7) { bindings[paramNames[7]] = GraphNodeUtil.flattenGraphNodes(arg7) }
            if(paramNames.length > 8) { bindings[paramNames[8]] = GraphNodeUtil.flattenGraphNodes(arg8) }
            if(paramNames.length > 9) { bindings[paramNames[9]] = GraphNodeUtil.flattenGraphNodes(arg9) }
            let result = requestEngine.request('evalOnServer', {
                expr: expr,
                bindings: bindings,
                installed: true
            });
            return result;
        };
    },

    /**
     * Finishes a TopBraid session. This always MUST be called at the end, e.g. in a finally block.
     * @param {?string} [logMessage] - the log message to use for the change entry in case any edits were made
     *        (not used in streaming mode).
     */
    terminate(logMessage) {
        requestEngine.terminate(logMessage);
    },

    /**
     * Evaluates a JavaScript expression on the TopBraid server.
     * This can be used to make remote procedure calls.
     * @param {string} expr - the JavaScript expression to evaluate
     * @param {Object} [bindings] - name-value pairs for values that will become pre-bound variables.
     *        This will instantiate the right type for instances of GraphNode and its subclasses,
     *        e.g. you may use focusNode and it will have the same JavaScript class on the TopBraid server.
     */
    eval(expr, bindings) {
        let b = GraphNodeUtil.flattenGraphNodes(bindings);
        let result = requestEngine.request('evalOnServer', {
            expr: expr,
            bindings: b
        })
        return result;
    }
}

const installFunctionHelper = (src) => {

    // Remove comments of the form /* ... */
    // Removing comments of the form //
    // Remove body of the function { ... }
    // removing '=>' if func is arrow function 
    let str = src.replace(/\/\*[\s\S]*?\*\//g, '') 
            .replace(/\/\/(.)*/g, '')         
            .replace(/{[\s\S]*}/, '')
            .replace(/=>/g, '')
            .trim();
    
    // Start parameter names after first '('
    let start = str.indexOf('(') + 1;
    
    // End parameter names is just before last ')'
    let end = str.length - 1;
    
    let result = str.substring(start, end).split(',');
    
    let params = [];
    
    result.forEach(element => {
            
        // Removing any default value
        element = element.replace(/=[\s\S]*/g, '').trim();
    
        if(element.length > 0) {
            params.push(element);
        }
    });
        
    return params;
}

// Used to collect certain operations in a queue before they get sent to the server.
// All of these operations need to return nothing and perform updates.
// The engine will collect those until there are enough of them or whenever a different
// (read) operation is requested.
const UPDATE_OPS = new Set([
    'add',
    'remove',
    'rollBack',
    'setPropertyValue',
    'setPropertyValueInverse',
    'setPropertyValuesInverse',
    'setPropertyValues',
    'setPropertyValuesIndexed',
    'update'
]);

const requestEngine = {

    flushUpdateQueue() {
        if(this.updateQueue.length > 0) {
            let url = `${this.serverURL}extScript/${this.extScriptId}/ops`;
            this.runRequest(url, this.updateQueue);
            this.updateQueue = [];
        }
    },

    init() {
        if(!('dataGraphId' in this)) {
            throw 'Missing data graph Id - call TopBraid.init() beforehand';
        }
        if(!('serverURL' in this)) {
            throw 'Missing server URL - call TopBraid.init() beforehand';
        }
        this.initWorker();
        let url = `${this.serverURL}extScript?dataGraphId=${this.dataGraphId}&shapesGraphId=${SHAPES_GRAPH_ID}&begin=true`;
        if(this.langs) {
            url += `&langs=${this.langs.join(',')}`;
        }
        if(this.streaming) {
            url += '&streaming=true';
        }
        let json = this.runRequest(url);
        this.extScriptId = json.id;
        this.initPrefixes(json.prefixes);
        __jenaData.dataGraphURI = json.dataGraphURI;
        this.updateQueue = [];
    },

    initPrefixes(prefix2NS) {
        let ns2Prefix = {};
        for(let prefix in prefix2NS) {
            let ns = prefix2NS[prefix];
            ns2Prefix[ns] = prefix;
        }
        __jenaData.prefix2NS = prefix2NS;
        __jenaData.ns2Prefix = ns2Prefix;
    },
    
    initWorker() {        
        // This is a bit of a hack to allow the request worker to wake this up while in Atomics.wait
        this.sharedBuffer = new SharedArrayBuffer(4),
        this.sharedArray = new Int32Array(this.sharedBuffer),
        this.worker = new Worker(`
try {
const { parentPort, MessagePort } = require('worker_threads');

const axios = require('axios');

var sharedBuffer = null;
var sharedArray = null;

var port;

parentPort.on('message', (message) => {
    if(message instanceof SharedArrayBuffer) {
        sharedBuffer = message;
        sharedArray = new Int32Array(sharedBuffer);
    }
    else if(message instanceof MessagePort) {
        port = message;
    }
    else {
        let url = message.url;
        let body = message.body;
        let config = message.config;
        axios.post(url, body, config).then(response => {
            if(response == null || response.data == null) {
                port.postMessage(null);
            }
            else {
                port.postMessage(response.data);
            }
            Atomics.store(sharedArray, 0, 1);
            Atomics.notify(sharedArray, 0);
        }).catch(error => {
            if(error.response) {
                if(error.response.data) {
                    console.error(error.response.data);
                }
                error = 'TopBraid responded with HTTP error ' + error.response.status + ': ' + error.response.data;
            }
            port.postMessage(error);
            Atomics.store(sharedArray, 0, 2);
            Atomics.notify(sharedArray, 0);
        })
    }
})
}
catch(error) {
    console.error('Failed to initialize ADS Node.js Worker Thread. Missing npm install worker_threads/axios?');
    console.error(error)
}`, {
    eval: true
});
        this.worker.postMessage(this.sharedBuffer);
        this.worker.postMessage(port1, [port1]);
    },

    request(op, params) {

        if(this.terminated) {
            throw 'TopBraid.terminate() has already been called.'
        }

        // Init on first request
        if(!this.extScriptId) {
            this.init();
        }

        if(UPDATE_OPS.has(op)) {
            // Queue updates
            let item = {
                op: op
            }
            if(params) {
                item.params = JSON.parse(JSON.stringify(params)); // Clone
            }
            this.updateQueue.push(item);
            if(this.updateQueue.length > 99) {
                this.flushUpdateQueue();
            }
            return;
        }

        if(!this.readsDoNotDependOnWrites) {
            this.flushUpdateQueue();
        }

        let url = `${this.serverURL}extScript/${this.extScriptId}/${op}`;

        let result = this.runRequest(url, params ? JSON.stringify(params) : undefined);
        if('evalOnServer' == op) {
            result = GraphNodeUtil.unflattenGraphNodes(result);
        }
        return result;
    },

    runRequest(url, body) {
        Atomics.store(this.sharedArray, 0, 0);
        this.worker.postMessage({
            url: url,
            body: body,
            config: this.config,
        });
        Atomics.wait(this.sharedArray, 0, 0);
        let response = receiveMessageOnPort(port2);
        if(Atomics.load(this.sharedArray, 0) == 2) {
            throw response.message;
        }
        return response.message;
    },

    terminate(logMessage) {
        this.flushUpdateQueue();
        this.request('end', {
            logMessage: logMessage,
        })
        this.terminated = true;
        if(this.worker) {
            this.worker.terminate();
        }
    }
}



// This file provides the functionality that ADS scripts running in GraalVM have as pre-bound Java objects.
// Uses the requestEngine helper object to communicate with TopBraid where needed.

/**
 * A partial replication of the Jena Node class, at least of the functions used by ADS.
 */
class JenaNode {

    constructor(obj) {
        if('uri' in obj) {
            this.uri = obj.uri;
        }
        else if('qname' in obj) {
            this.uri = graph.uri(obj.qname);
            if(this.uri == obj.qname) {
                throw 'Cannot expand qname "' + obj.qname + '" to a URI'
            }
        }
        else if('lex' in obj) {
            this.lex = obj.lex;
            if('lang' in obj && obj.lang && obj.lang != '') {
                this.lang = obj.lang;
            }
            else if('datatype' in obj) {
                if(typeof obj.datatype == 'string') {
                    this.datatype = obj.datatype;
                }
                else if(typeof obj.datatype == 'object' && 'uri' in obj.datatype) {
                    this.datatype = obj.datatype.uri;
                }
                else {
                    throw 'Unexpected datatype value ' + obj.datatype;
                }
            }
        }
        else {
            throw 'Unexpected input obj to JenaNode constructor - neither uri, qname nor lex found'
        }
    }

    equals(other) {
        if('uri' in this) {
            return this.uri == other.uri;
        }
        else if(this.lex == other.lex) {
            if('lang' in this) {
                return this.lang == other.lang;
            }
            else {
                return this.datatype == other.datatype;
            }
        }
        else {
            return false;
        }
    }

    getBlankNodeLabel() {
        if('uri' in this && this.uri.startsWith('_:')) {
            return this.uri.substring(2);
        }
    }

    getLiteralDatatypeURI() {
        return this.datatype;
    }

    getLiteralLexicalForm() {
        return this.lex;
    }

    getLiteralLanguage() {
        return this.lang;
    }

    getURI() {
        if('uri' in this && !this.uri.startsWith('_:')) {
            return this.uri;
        }
    }

    isBlank() {
        return 'uri' in this && this.uri.startsWith('_:');
    }

    isLiteral() {
        return 'lex' in this;
    }

    isURI() {
        return 'uri' in this && !this.uri.startsWith('_:');
    }
}

JenaNode.FALSE = new JenaNode({
    lex: 'false',
    datatype: 'http://www.w3.org/2001/XMLSchema#boolean'
})

JenaNode.TRUE = new JenaNode({
    lex: 'true',
    datatype: 'http://www.w3.org/2001/XMLSchema#boolean'
})

const NUMERIC_DATATYPES = new Set([
    'http://www.w3.org/2001/XMLSchema#byte',
    'http://www.w3.org/2001/XMLSchema#decimal',
    'http://www.w3.org/2001/XMLSchema#double',
    'http://www.w3.org/2001/XMLSchema#float',
    'http://www.w3.org/2001/XMLSchema#int',
    'http://www.w3.org/2001/XMLSchema#integer',
    'http://www.w3.org/2001/XMLSchema#long',
    'http://www.w3.org/2001/XMLSchema#negativeInteger',
    'http://www.w3.org/2001/XMLSchema#nonNegativeInteger',
    'http://www.w3.org/2001/XMLSchema#nonPositiveInteger',
    'http://www.w3.org/2001/XMLSchema#positiveInteger',
    'http://www.w3.org/2001/XMLSchema#short',
    'http://www.w3.org/2001/XMLSchema#unsignedByte',
    'http://www.w3.org/2001/XMLSchema#unsignedInt',
    'http://www.w3.org/2001/XMLSchema#unsignedLong',
    'http://www.w3.org/2001/XMLSchema#unsignedShort',
]);


/**
 * A pure JavaScript implementation of the JenaData class that is hard-coded for GraalVM as a Java object.
 * Delegates most of its functions to the requestEngine.
 * The details of the protocol here are internal to TopBraid, yet the code may be useful for debugging.
 * External scripts must not call any these functions directly!
 */
const __jenaData = {

    add(subject, predicate, object) {
        requestEngine.request('add', {
            subject: this.asJenaNodeStringURIs(subject),
            predicate: this.asJenaNodeStringURIs(predicate),
            object: this.asJenaNode(object),
        })
    },

    asJenaNode(obj) {
        if(obj == null || obj == undefined) {
            return null;
        }
        else if(typeof obj == 'object') {
            if(obj instanceof JenaNode) {
                return obj;
            }
            else {
                return new JenaNode(obj);
            }
        }
        else if(obj === true) {
            return JenaNode.TRUE;
        }
        else if(obj === false) {
            return JenaNode.FALSE;
        }
        else if(typeof obj == 'string') {
            return new JenaNode({
                lex: obj,
                datatype: 'http://www.w3.org/2001/XMLSchema#string'
            })
        }
        else if(typeof obj == 'number') {
            if(Number.isInteger(obj)) {
                return new JenaNode({
                    lex: obj.toString(),
                    datatype: 'http://www.w3.org/2001/XMLSchema#integer'
                })
            }
            else {
                return new JenaNode({
                    lex: obj.toString(),
                    datatype: 'http://www.w3.org/2001/XMLSchema#decimal'
                })
            }
        }
        return new JenaNode(obj);
    },

    asJenaNodeMap(bindingsMap) {
        if(bindingsMap) {
            let map = {};
            for(let key in bindingsMap) {
                let value = bindingsMap[key];
                if(value != null) {
                    map[key] = this.asJenaNode(value);
                }
            }
            return map;
        }
    },

    asJenaNodes(values) {
        if(values == null || values == undefined) {
            return [];
        }
        else {
            return values.map(this.asJenaNode);
        }
    },

    asJenaNodeStringURIs(obj) {
        if(obj == null || obj == undefined) {
            return null;
        }
        else if(typeof obj == 'string') {
            return new JenaNode({uri: obj});
        }
        else {
            return new JenaNode(obj);
        }
    },

    blankNode() {
        // This could be streamlined by using client-side UUID generation
        let id = requestEngine.request('blankNode');
        return new JenaNode({
            uri: '_:' + id
        })
    },

    callFunction(functionURI) {
        let args = [];
        for(let i = 1; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        let result = requestEngine.request({
            op: 'callFunction',
            functionURI: functionURI,
            args: args
        })
        if(result != null) {
            return new JenaNode(result);
        }
        else {
            return null;
        }
    },

    construct(queryString, bindingsMap, literalNodesOnly) {
        let result = requestEngine.request('construct', {
            queryString: queryString,
            bindingsMap: this.asJenaNodeMap(bindingsMap),
            literalNodesOnly: literalNodesOnly,
        })
        return result.map(b => {
            let nb = {};
            for(let varName in b) {
                let value = b[varName];
                if(value != null && typeof value == 'object') {
                    nb[varName] = new JenaNode(value);
                }
                else {
                    nb[varName] = value;
                }
            }
            return nb;
        })
    },

    contains(subject, predicate, object) {
        let result = requestEngine.request('contains', {
            subject: this.asJenaNodeStringURIs(subject),
            predicate: this.asJenaNodeStringURIs(predicate),
            object: this.asJenaNode(object),
        })
        return result;
    },

    createTempGraph() {
        return requestEngine.request('createTempGraph');
    },

    enterDataGraphURI(uri, logMessage) {
        requestEngine.request('enterDataGraphURI', {
            uri: uri,
            logMessage: logMessage,
        })
        this.dataGraphURI = uri;
    },

    exitDataGraphURI(uri) {
        requestEngine.request('exitDataGraphURI', {
            uri: uri
        })
        this.dataGraphURI = uri;
    },

    equalNodes(a, b) {
        let an = this.asJenaNode(a);
        let bn = this.asJenaNode(b);
        if(an == null) {
            return bn == null;
        }
        else if(bn == null) {
            return an == null;
        }
        else {
            return an.equals(bn);
        }
    },

    eval(exprString, bindingsMap, literalNodesOnly) {
        return this.evalThis(null, exprString, bindingsMap, literalNodesOnly);
    },

    evalThis(thisNode, exprString, bindingsMap, literalNodesOnly) {
        let result = requestEngine.request('evalThis', {
            thisNode: this.asJenaNode(thisNode),
            exprString: exprString,
            bindingsMap: this.asJenaNodeMap(bindingsMap),
            literalNodesOnly: literalNodesOnly,
        })
        if(result != null && typeof result == 'object') {
            return new JenaNode(result);
        }
        else {
            return result;
        }
    },

    every(uri) {
        let result = requestEngine.request('every', {
            uri: uri
        })
        return result.map(r => new JenaNode(r));
    },

    getAddedTripleCount() {
        return requestEngine.request('getAddedTripleCount');
    },

    getAddedTriples() {
        return requestEngine.request('getAddedTriples');
    },

    getDataGraphURI() {
        return this.dataGraphURI;
    },

    getDisplayLabel(node) {
        let jenaNode = this.asJenaNode(node);
        let result = requestEngine.request('getDisplayLabel', jenaNode);
        return result;
    },

    getRemovedTripleCount() {
        return requestEngine.request('getRemovedTripleCount');
    },

    getRemovedTriples() {
        return requestEngine.request('getRemovedTriples');
    },

    http() {
        throw 'Not implemented - use native platform features such as axios on Node.js'
    },

    instanceOf(node, typeObject) {
        let result = requestEngine.request('instanceOf', {
            node: node,
            type: this.asJenaNodeStringURIs(typeObject),
        })
        return result;
    },

    isNumeric(datatypeURI) {
        return NUMERIC_DATATYPES.has(datatypeURI);
    },

    localName(uri) {
        return uri.substring(this.splitNamespaceXML(uri));
    },

    nameSpace(uri) {
        return uri.substring(0, this.splitNamespaceXML(uri));
    },

    qname(uri) { // Copied from Jena's PrefixMappingImpl.qnameFor
        let split = this.splitNamespaceXML(uri);
        let ns = uri.substring(0, split);
        let local = uri.substring(split);
        if(local.length == 0) {
            return null;
        }
        let prefix = this.ns2Prefix[ns];
        return prefix == null ? null : prefix + ':' + local;
    },

    remove(subject, predicate, object) {
        let s = this.asJenaNodeStringURIs(subject);
        let p = this.asJenaNodeStringURIs(predicate);
        let o = this.asJenaNode(object);
        requestEngine.request('remove', {
            subject: s,
            predicate: p,
            object: o,
        })
    },

    rollBack() {
        requestEngine.request('rollBack');
    },

    select(queryString, bindingsMap, literalNodesOnly) {
        return this.selectThis(null, queryString, bindingsMap, literalNodesOnly);
    },

    selectThis(thisNode, queryString, bindingsMap, literalNodesOnly) {
        let result = requestEngine.request('selectThis', {
            thisNode: thisNode,
            queryString: queryString,
            bindingsMap: this.asJenaNodeMap(bindingsMap),
            literalNodesOnly: literalNodesOnly
        })
        let r = {
            vars: result.vars,
            bindings: result.bindings.map(b => {
                let nb = {};
                for(let varName in b) {
                    let value = b[varName];
                    if(value != null && typeof value == 'object') {
                        nb[varName] = new JenaNode(value);
                    }
                    else {
                        nb[varName] = value;
                    }
                }
                return nb;
            })
        }
        return r;
    },

    serializeRDF(triples, responseType) {
        let result = requestEngine.request('serializeRDF', {
            triples: triples.map(triple => {
                return {
                    subject: this.asJenaNode(triple.subject),
                    predicate: this.asJenaNode(triple.predicate),
                    object: this.asJenaNode(triple.object),
                }
            }),
            responseType: responseType,
        })
        return result;
    },

    setPrefix(prefix, namespace) {
        requestEngine.request('setPrefix', {
            prefix: prefix,
            namespace: namespace,
        })
    },

    setPropertyValue(focusNode, predicateURI, value, datatypeHint) {
        requestEngine.request('setPropertyValue', {
            focusNode: this.asJenaNode(focusNode),
            predicateURI: predicateURI,
            value: this.asJenaNode(value),
            datatypeHint: datatypeHint
        })
    },

    setPropertyValues(focusNode, predicateURI, values, datatypeHint) {
        requestEngine.request('setPropertyValues', {
            focusNode: this.asJenaNode(focusNode),
            predicateURI: predicateURI,
            values: this.asJenaNodes(values),
            datatypeHint: datatypeHint
        })
    },

    setPropertyValuesIndexed(focusNode, predicateURI, values, datatypeHint) {
        requestEngine.request('setPropertyValuesIndexed', {
            focusNode: this.asJenaNode(focusNode),
            predicateURI: predicateURI,
            values: this.asJenaNodes(values),
            datatypeHint: datatypeHint
        })
    },

    setPropertyValueInverse(focusNode, predicateURI, value) {
        requestEngine.request('setPropertyValueInverse', {
            focusNode: this.asJenaNode(focusNode),
            predicateURI: predicateURI,
            value: this.asJenaNode(value)
        })
    },

    setPropertyValuesInverse(focusNode, predicateURI, values) {
        requestEngine.request('setPropertyValuesInverse', {
            focusNode: focusNode,
            predicateURI: predicateURI,
            values: this.asJenaNodes(values),
        })
    },

    sparqlExpressionString(value) {
        let result = requestEngine.request('sparqlExpressionString', {
            value: value,
        })
        return result;
    },

    sqlQuery() {
        throw 'Support for TopBraid SQL queries is not available for external scripts. Use external APIs instead.'
    },

    sqlUpdate() {
        throw 'Support for TopBraid uploadedFiles is not available for external scripts. Use external APIs instead.'
    },

    splitNamespaceXML(uri) {
        
        const isNCNameChar = (c) => {
            if(c == ':') {
                return false;
            }
            if(isNCNameStart(c)) {
                return true;
            }
            return /-|\.|[0-9]|\xB7|[\u0300-\u036F]|[\u203F-\u2040]/.test(c);
        };
        
        const isNCNameStart = (c) => {
            return /:|[A-Z]|_|[a-z]|[\xC0-\xD6]|[\xD8-\xF6]|[\xF8-\u02FF]|[\u0370-\u037D]|[\u037F-\u1FFF]|[\u200C-\u200D]|[\u2070-\u218F]|[\u2C00-\u2FEF]|[\u3001-\uD7FF]|[\uF900-\uFDCF]|[\uFDF0-\uFFFD]/.test(c);
        };

        let ch;
        let lg = uri.length;
        if (lg == 0) {
            return 0;
        }
        let i = lg - 1;
        for ( ; i >= 1 ; i--) {
            ch = uri.charAt(i);
            if (!isNCNameChar(ch)) break;
        }
    
        let j = i + 1 ;
        if ( j >= lg )
            return lg ;
    
        if ( j >= 2 && uri.charAt(j-2) == '%' ) {
            j = j + 1 ;
        }
        if ( j >= 1 && uri.charAt(j-1) == '%' ) {
            j = j + 2 ;
            if ( j > lg ) {
                return lg;
            }
        }
    
        for (; j < lg; j++) {
            ch = uri.charAt(j);
            if (isNCNameStart(ch)) {
                if ( j == 7 && uri.startsWith('mailto:'))
                    continue;
                else
                    break;
            }
        }
        return j;
    },

    swp(viewClassName, paramsMap) {
        let result = requestEngine.request('swp', {
            viewClassName: viewClassName,
            paramsMap: paramsMap,
        });
        return result;
    },

    update(updateString, bindingsMap) {
        requestEngine.request('update', {
            updateString: updateString,
            bindingsMap: this.asJenaNodeMap(bindingsMap),
        });
    },

    uploadedFile(fileId) {
        throw 'Support for TopBraid uploadedFiles is not available for external scripts. Use external APIs or installed functions instead.'
    },

    uri(qname) {
        let colIndex = qname.indexOf(':');
        if(colIndex >= 0) {
            let prefix = qname.substring(0, colIndex);
            if(prefix in this.prefix2NS) {
                return this.prefix2NS[prefix] + qname.substring(colIndex + 1);
            }
        }
        return qname;
    },

    validate(params) {
        if(params) {
            if(params.focusNodes) {
                params.focusNodes = this.asJenaNodes(params.focusNodes);
            }
        }
        let results = requestEngine.request('validate', params);
        return results;
    },

    value(focusNode, path, simple) {
        let result = requestEngine.request('value', {
            focusNode: focusNode,
            path: path,
            simple: simple,
        })
        if(result != null && typeof result == 'object') {
            return new JenaNode(result);
        }
        else {
            return result;
        }
    },

    valueNode(focusNode, path, simple) {
        let result = requestEngine.request('value', {
            focusNode: focusNode,
            path: path,
            simple: simple,
            literal: true,
        })
        if(result != null && typeof result == 'object') {
            return new JenaNode(result);
        }
        else {
            return result;
        }
    },

    values(focusNode, path, simple) {
        let result = requestEngine.request('values', {
            focusNode: focusNode,
            path: path,
            simple: simple,
        })
        return result.map(v => {
            if(typeof v == 'object') {
                return new JenaNode(v);
            }
            else {
                return v;
            }
        })
    },

    literalNodes(focusNode, path, simple) {
        let result = requestEngine.request('values', {
            focusNode: focusNode,
            path: path,
            simple: simple,
            literal: true,
        })
        return result.map(v => {
            if(typeof v == 'object') {
                return new JenaNode(v);
            }
            else {
                return v;
            }
        })
    },

    valuesIndexed(focusNode, path, simple) {
        let result = requestEngine.request('valuesIndexed', {
            focusNode: focusNode,
            path: path,
            simple: simple,
        })
        return result.map(v => {
            if(typeof v == 'object') {
                return new JenaNode(v);
            }
            else {
                return v;
            }
        })
    }
}



export {
	GraphNode,
	GraphNodeArray,
	GraphType,
	IO,
	LiteralNode,
	NamedNode,
	ResultSet,
	SQL,
	SpreadsheetIterator,
	UploadedFile,
	UploadedSpreadsheet,
	XMLNode,
	afn,
	dash,
	dash_ConstraintReificationShape,
	dash_ShapeClass,
	dataset,
	fn,
	graph,
	graphql,
	graphql_Schema,
	owl,
	owl_Class,
	owl_Ontology,
	rdf,
	rdf_Property,
	rdfs,
	rdfs_Class,
	rdfs_Datatype,
	sh,
	sh_ConstraintComponent,
	sh_NodeShape,
	sh_Parameter,
	sh_Parameterizable,
	sh_PropertyGroup,
	sh_PropertyShape,
	sh_Rule,
	sh_SPARQLRule,
	sh_Shape,
	sh_TargetType,
	sh_TripleRule,
	skos,
	skos_Collection,
	skos_Concept,
	skos_ConceptScheme,
	skos_OrderedCollection,
	skosxl,
	skosxl_Label,
	smf,
	sparql,
	spif,
	tbs,
	teamwork,
	tosh,
	xsd
}

