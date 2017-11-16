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

        let bucket_exists = false;

        try {
            const list_buckets_response = await this.b2.listBuckets();
            const list_of_buckets = list_buckets_response && list_buckets_response.data || [];
            const existing_bucket = list_of_buckets.find( bucket => bucket.bucketName === this.options.bucket );
            bucket_exists = !!existing_bucket;
        }
        catch ( ex ) {
            bucket_exists = false;
        }

        if ( bucket_exists ) {
            return;
        }

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

        const processed = await this.options.processors.map( processor => processor.serialize ).reduce( async( _object, serialize ) => {
            if ( !serialize ) {
                return _object;
            }

            return await serialize( _object );
        }, object );

        const data = JSON.stringify( processed, null, 4 );

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

        const response = await this.b2.downloadFileByName( {
            bucketName: this.options.bucket,
            fileName: path
        } );

        const processed = JSON.parse( response && response.data );

        const object = await this.options.processors.map( processor => processor.deserialize ).reduceRight( async( _object, deserialize ) => {
            if ( !deserialize ) {
                return _object;
            }

            return await deserialize( _object );
        }, processed );

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
        const instance = Object.assign( {}, B2_Driver );

        const options = extend( true, {
            readable: true,
            id_field: 'id',
            b2: {},
            bucket: null,
            get_object_path: object => {
                return `/${ object[ instance.options.id_field ] }.json`;
            },
            get_id_path: id => {
                return `/${ id }.json`;
            },
            processors: []
        }, _options );

        instance.options = options;

        return instance;
    }
};