const pages = {
    append : {
        container : () => {
            if ( pages.nodes.container == null ) {
                const containerNode = document.createElement( 'pageContainer' );
                pages.nodes.container = containerNode;
                pages.nodes.app.appendChild( pages.nodes.container );
            }
        }
    },
    load : arr => {
        pages.append.container();
        arr.forEach( async page => {
            try {
                const response = await fetch( `/pages/${page}/page.html`);
                if ( response.status == 200 ) {
                    const resultHTML = await response.text();
                    const pageNode = document.createElement( 'page' );
                    pageNode.setAttribute( 'id', page.replace( /\//g, '-' ) );
                    pageNode.innerHTML = resultHTML;
                    pages.nodes.container.appendChild( pageNode );
                    const script = document.createElement("script");
                    script.src = `/pages/${page}/script.js`;
                    script.type = 'module';
                    script.setAttribute( 'page', page.replace( /\//g, '-' ) );
                    pages.nodes.head.appendChild(script);
                } else {
                    throw `/pages/${page}/page.html - Not Found`;
                }
            } catch ( error ) {
                console.log( error );
            }
        });
    },
    nodes : {
        app : document.querySelector( 'app' ),
        head : document.querySelector( 'head' ),
        container : document.querySelector( 'pageContainer' ),
    },
}
export default pages;