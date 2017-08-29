'use strict';

const B2_Driver = require( '../index.js' );
const tape = require( 'tape-async' );

tape( 'API: imports properly', t => {
    t.ok( B2_Driver, 'module exports' );
    t.equal( B2_Driver && typeof B2_Driver.create, 'function', 'exports create()' );
    t.end();
} );

tape( 'API: API is correct on driver instance', t => {

    const b2_driver = B2_Driver.create();

    t.ok( b2_driver, 'got driver instance' );

    t.equal( b2_driver && typeof b2_driver.init, 'function', 'exports init' );
    t.equal( b2_driver && typeof b2_driver.stop, 'function', 'exports stop' );
    t.equal( b2_driver && typeof b2_driver.put, 'function', 'exports put' );
    t.equal( b2_driver && typeof b2_driver.get, 'function', 'exports get' );
    t.equal( b2_driver && typeof b2_driver.del, 'function', 'exports del' );

    t.end();
} );