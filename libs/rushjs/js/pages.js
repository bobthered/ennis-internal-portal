const pages = {
    nodes : {
        app : document.querySelector( 'app' ),
        head : document.querySelector( 'head' ),
    },
    load : arr => {
        arr.forEach( async page => {
            try {
                const response = await fetch( `/pages/${page}/page.html`);
                if ( response.status == 200 ) {
                    const resultHTML = await response.text();
                    const pageNode = document.createElement( 'page' );
                    pageNode.setAttribute( 'id', page.replace( /\//g, '-' ) );
                    pageNode.innerHTML = resultHTML;
                    pages.nodes.app.appendChild( pageNode );
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
    }
}
export default pages;