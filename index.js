'use strict';

const B2 = require( 'backblaze-b2' );
const extend = require( 'extend' );

const B2_Driver = {
    init: async function() {
        if ( !this.options.bucket ) {
            throw new Error( 'Must specify a bucket!' );
        }

        this.b2 = new B2( this.options.b2 );

        await this.b2.authorize();
        await this.b2.createBucket( this.options.bucket, 'allPrivate' );
    },

    stop: async function() {
        return;
    },

    put: async function( object ) {
        const path = this.options.get_object_path( object );
        if ( !path ) {
            throw new Error( 'invalid object path' );
        }

        const data = JSON.stringify( object, null, 4 );

        const upload_url_response = await this.b2.getUploadUrl( this.options.bucket );

        await this.b2.uploadFile( {
            uploadUrl: upload_url_response.data.uploadUrl,
            uploadAuthToken: upload_url_response.data.authorizationToken,
            filename: path,
            mime: 'application/json',
            data: Buffer.from( data ),
        } );
    },

    get: async function( id ) {
        const path = this.options.get_id_path( id );
        if ( !path ) {
            throw new Error( 'invalid id path' );
        }

        const response = await this.b2.downloadFileByName({
            bucketName: this.options.bucket,
            fileName: path
        } );

        const object = JSON.parse( response && response.data );

        return object;
    },

    del: async function( id ) {
        const path = this.options.get_id_path( id );
        if ( !path ) {
            throw new Error( 'invalid id path' );
        }

        await this.b2.hideFile( {
            bucketId: this.options.bucket,
            fileName: path
        } );
    }
};

module.exports = {
    create: function( _options ) {
        const options = extend( true, {
            readable: true,
            id_field: 'id',
            b2: {},
            bucket: null,
            get_object_path: object => {
                return `/${ object[ this.options.id_field ] }.json`;
            },
            get_id_path: id => {
                return `/${ id }.json`;
            }
        }, _options );

        const instance = Object.assign( {}, B2_Driver );
        instance.options = options;

        return instance;
    }
};