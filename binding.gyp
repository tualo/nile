{
    'includes': [ 'common.gypi' ],
  'variables': {
    'coverage': 'false'
  },
    "targets": [
    {
      "target_name": "tile",
      "sources": [
        "cpp/src/addon.cc",
        "cpp/src/tile.cc"
      ],
      'defines': [
          'MAPNIK_GIT_REVISION="<!@(mapnik-config --git-describe)"',
          'CLIPPER_INTPOINT_IMPL=mapnik::geometry::point<cInt>',
          'CLIPPER_PATH_IMPL=mapnik::geometry::line_string<cInt>',
          'CLIPPER_PATHS_IMPL=mapnik::geometry::multi_line_string<cInt>',
          'CLIPPER_IMPL_INCLUDE=<mapnik/geometry.hpp>'
      ],
      "include_dirs": [
          "<!(node -e \"require('nan')\")",
          "<!(mapnik-config --cflags)"
      ],
      "conditions": [
          ["coverage == 'true'", {
                "cflags_cc": ["--coverage"],
                "xcode_settings": {
                    "OTHER_CPLUSPLUSFLAGS":[
                        "--coverage"
                    ],
                    'OTHER_LDFLAGS':[
                        '--coverage'
                    ]
                }
            }],
          ['OS=="mac"', {
            'cflags_cc!': [
                '-fno-rtti',
                '-fno-exceptions',
                '-Wno-unused-variable',
                '-Wno-shadow'],
            'cflags_cc' : [
              '<!@(mapnik-config --cflags)'
            ],
            'libraries':[
              '<!@(mapnik-config --libs)',
              '-lmapnik-wkt',
              '-lmapnik-json',
              '<!@(mapnik-config --ldflags)',
              '-lprotobuf-lite',
            ],
            'xcode_settings': {
              'OTHER_CPLUSPLUSFLAGS':[
                '<!@(mapnik-config --cflags)',
              ],
              'OTHER_CFLAGS':[
                '<!@(mapnik-config --cflags)'
              ],
              'OTHER_LDFLAGS':[
                '-Wl,-bind_at_load'
              ],
              'GCC_ENABLE_CPP_RTTI': 'YES',
              'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
              'MACOSX_DEPLOYMENT_TARGET':'10.8',
              'CLANG_CXX_LIBRARY': 'libc++',
              'CLANG_CXX_LANGUAGE_STANDARD':'c++11',
              'GCC_VERSION': 'com.apple.compilers.llvm.clang.1_0'
            }
          }],
          ['OS=="linux"', {
            'cflags_cc!': [
                '-fno-rtti',
                '-fno-exceptions',
                '-Wno-unused-variable',
                '-Wno-shadow'],
            'cflags_cc' : [
              '<!@(mapnik-config --cflags)'
            ],
            'libraries':[
              '<!@(mapnik-config --libs)',
              '-lmapnik-wkt',
              '-lmapnik-json',
              '<!@(mapnik-config --ldflags)',
              '-lprotobuf-lite',
            ]
          }]
      ],



    }



    ]

}
