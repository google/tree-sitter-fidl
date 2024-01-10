/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const
  letter = /[a-zA-Z]/,
  decimal_digit = /[0-9]/,
  hex_digit = /[0-9A-Fa-f]/

module.exports = grammar({
  name: 'fidl',

  extras: $ => [$.comment, /\s/],

  rules: {
    // file = library-header , ( using-list ) , declaration-list
    source_file: $ => seq(
      $.library,
      optional($.using_list),
      repeat($.declaration),
    ),

    // library-header = ( attribute-list ) , "library" , compound-identifier , ";"
    library: $ => seq(
      optional($.attribute_list),
      "library",
      $.compound_identifier,
      ';',
    ),

    // identifier = [a-zA-Z]([a-zA-Z0-9_]*[a-zA-Z0-9])?
    identifier: $ => token(seq(
      letter,
      optional(repeat(choice(
        letter,
        decimal_digit,
        '_',
      ))),
    )),

    // using-list = ( using , ";" )*
    //
    // 2 Changes:
    // - the ; moved to `using`.
    // - `using` one or more, and optional in `source_file`.
    using_list: $ => repeat1($.using),

    // using = "using" , compound-identifier , ( "as" , IDENTIFIER )
    using: $ => seq(
      'using',
      $.compound_identifier,
      optional(seq(
        'as',
        $.identifier,
      )),
      ';'
    ),

    // compound-identifier = IDENTIFIER ( "." , IDENTIFIER )*
    compound_identifier: $ => seq(
      $.identifier,
      optional(repeat(seq('.', $.identifier))),
    ),

    // declaration-list = ( declaration , ";" )*
    // defined a repeat at source_file.

    // declaration = const-declaration | layout-declaration | protocol-declaration
    //             | type-alias-declaration | resource-declaration | service-declaration
    declaration: $ => seq(
      choice(
        $.const_declaration,
        $.layout_declaration,
        $.protocol_declaration,
        $.type_alias_declaration,
        $.resource_declaration,
        $.service_declaration,
      ),
      ';',
    ),

    // const-declaration = ( attribute-list ) , "const" , IDENTIFIER , type-constructor , "=" , constant
    const_declaration: $ => seq(
      optional($.attribute_list),
      'const',
      $.identifier,
      $.type_constructor,
      '=',
      $.constant_allows_bit_ops,
    ),

    // layout-declaration = ( attribute-list ) , "type" , IDENTIFIER , "=" , inline-layout ; [NOTE 1]
    layout_declaration: $ => seq(
      optional($.attribute_list),
      'type',
      $.identifier,
      '=',
      $.inline_layout,
    ),

    // inline-layout = ( attribute-list ) , ( declaration-modifiers )* , layout-kind , ( layout-subtype ) ,
    //                 layout-body
    inline_layout: $ => seq(
      optional($.attribute_list),
      repeat($.declaration_modifiers),
      $.layout_kind,
      optional($.layout_subtype),
      $.layout_body,
    ),

    // declaration-modifiers = "flexible" | "strict" | "resource" ; [NOTE 2]
    declaration_modifiers: $ => choice('flexible', 'strict', 'resource'),

    // layout-subtype = ":" , type-constructor ; [NOTE 3]
    layout_subtype: $ => seq(':', $.type_constructor),

    // layout-kind = "struct" | "bits" | "enum" | "union" | "table"
    //
    // and "overlay"
    layout_kind: $ => choice('struct', 'bits', 'enum', 'union', 'table', 'overlay'),

    // layout-body = value-layout | struct-layout | ordinal-layout
    layout_body: $ => choice(
      $.value_layout, $.struct_layout, $.ordinal_layout,
    ),

    // value-layout = "{" , ( value-layout-member , ";" )+ , "}"
    value_layout: $ => seq(
      '{',
      repeat1(seq($.value_layout_member, ';')),
      '}',
    ),

    // value-layout-member = ( attribute-list ) , IDENTIFIER , "=" , constant
    // [NOTE 4]: constant -> constant_allows_bit_ops
    value_layout_member: $ => seq(
      optional($.attribute_list),
      $.identifier,
      '=',
      $.constant_allows_bit_ops,
    ),

    // struct-layout =  "{" , ( struct-layout-member, ";" )* , "}"
    struct_layout: $ => seq(
      '{',
      repeat(seq($.struct_layout_member, ';')),
      '}',
    ),

    // struct-layout-member = ( attribute-list ) , member-field
    struct_layout_member: $ => seq(
      optional($.attribute_list),
      $.member_field,
    ),

    // ordinal-layout =  "{" , ( ordinal-layout-member , ";" )* , "}" ; [NOTE 5]
    ordinal_layout: $ => seq(
      '{',
      repeat1(seq($.ordinal_layout_member, ';')),
      '}',
    ),

    // ordinal-layout-member = ( attribute-list ) , ordinal , ":" , ordinal-layout-member-body
    //
    // ordinal = NUMERIC-LITERAL
    // [NOTE 6] attribute-list does not allow for reserved.
    ordinal_layout_member: $ => choice(
      seq(optional($.attribute_list), $.numeric_literal, ':', $.member_field),
      seq($.numeric_literal, ':', 'reserved', optional($.type_constructor)),
    ),

    // ordinal-layout-member-body = member-field | "reserved"
    // impl in ordinal-layout-member.

    // protocol-declaration = ( attribute-list ) , "protocol" , IDENTIFIER ,
    //                        "{" , ( protocol-member , ";" )*  , "}"
    //
    // Change:
    // add open, closed, ajar
    protocol_declaration: $ => seq(
      optional($.attribute_list),
      optional($.protocol_attribute),
      'protocol',
      $.identifier,
      '{',
      repeat(seq($.protocol_member, ';')),
      '}',
    ),

    protocol_attribute: $ => choice('open', 'closed', 'ajar'),

    // protocol-member = protocol-method | protocol-event | protocol-compose
    protocol_member: $ => choice(
      $.protocol_method,
      $.protocol_event,
      $.protocol_compose,
    ),

    // protocol-method = ( attribute-list ) , IDENTIFIER , parameter-list,
    //                   ( "->" , parameter-list , ( "error" type-constructor ) ) ; [NOTE 7]
    //
    // also support declaration_modifiers
    protocol_method: $ => seq(
      optional($.attribute_list),
      optional($.declaration_modifiers),
      $.identifier,
      $.parameter_list,
      optional(seq(
        '->',
        $.parameter_list,
        optional(seq(
          'error',
          $.type_constructor,
        )),
      ))
    ),

    // protocol-event = ( attribute-list ) , "->" , IDENTIFIER , parameter-list
    //
    // also support declaration_modifiers, and error
    protocol_event: $ => seq(
      optional($.attribute_list),
      optional($.declaration_modifiers),
      '->',
      $.identifier,
      $.parameter_list,
      optional(seq(
        'error',
        $.type_constructor,
      )),
    ),

    // parameter-list = "(" , ( type-constructor ) , ")" ; [NOTE 8]
    parameter_list: $ => seq(
      '(',
      optional($.type_constructor),
      ')',
    ),

    // protocol-compose = "compose" , compound-identifier
    //
    // also support attribute-list
    protocol_compose: $ => seq(
      optional($.attribute_list),
      'compose',
      $.compound_identifier
    ),

    // type-alias-declaration = ( attribute-list ) , "alias" , IDENTIFIER ,  "=" , type-constructor
    type_alias_declaration: $ => seq(
      optional($.attribute_list),
      'alias',
      $.identifier,
      '=',
      $.type_constructor,
    ),

    // resource-declaration = ( attribute-list ) , "resource_definition" , IDENTIFIER , ":",
    //                        "uint32" , "{" , resource-properties ,  "}"
    resource_declaration: $ => seq(
      optional($.attribute_list),
      'resource_definition',
      $.identifier,
      ':',
      'uint32',
      '{',
      $.resource_properties,
      '}',
    ),

    // resource-properties = "properties" , "{" , ( member-field  , ";" )* , "}" , ";"
    resource_properties: $ => seq(
      'properties',
      '{',
      repeat(seq(
        $.member_field,
        ';',
      )),
      '}',
      ';'
    ),

    // service-declaration = ( attribute-list ) , "service" , IDENTIFIER , "{" ,
    //                       ( service-member , ";" )* , "}"
    service_declaration: $ => seq(
      optional($.attribute_list),
      'service',
      $.identifier,
      '{',
      repeat($.service_member),
      '}',
    ),

    // service-member = ( attribute-list ) , member-field ; [NOTE 9]
    // move ; to service-member.
    service_member: $ => seq(
      optional($.attribute_list),
      $.member_field,
      ';'
    ),

    // member-field = IDENTIFIER , type-constructor
    //
    // It also allow default value as optional.
    member_field: $ => seq(
      $.identifier,
      $.type_constructor,
      optional(seq(
        '=',
        $.constant,
      )),
    ),

    // attribute-list = ( attribute )*
    //
    // change:
    // - `attribute` one or more, use optional in `attribute_list` usage.
    attribute_list: $ => repeat1($.attribute),

    // attribute = "@", IDENTIFIER , ( "(" , constant | attribute-args, ")" )
    attribute: $ => seq(
      '@',
      $.identifier,
      optional(seq(
        '(',
        choice(
          $.constant,
          $.attribute_args,
        ),
        ')',
      )),
    ),

    // attribute-args = attribute-arg | attribute-arg, "," attribute-args
    attribute_args: $ => seq(
      $.attribute_arg,
      repeat(seq(
        ',',
        $.attribute_arg,
      )),
    ),

    // attribute-arg = IDENTIFIER , "=" , constant
    attribute_arg: $ => seq(
      $.identifier,
      '=',
      $.constant,
    ),

    primitives_type: $ => choice(
      'bool',
      'int8',
      'int16',
      'int32',
      'int64',
      'uint8',
      'uint16',
      'uint32',
      'uint64',
      'float32',
      'float64',
      'byte',
    ),

    builtin_complex_type: $ => choice(
      'string',
      'array',
      'vector',
      'box',
      'zx.Handle',
      'zx.Status',
      'client_end',
      'server_end',
    ),

    // type-constructor = layout , ( "<" , layout-parameters , ">" ) , ( ":" type-constraints )
    //
    // extract primitives_type for better highlights
    type_constructor: $ => choice(
      $.primitives_type,
      seq(
        $.layout,
        optional(seq(
          '<',
          $.layout_parameters,
          '>',
        )),
        optional(seq(
          ':',
          $.type_constraints,
        )),
      ),
    ),

    // layout = compound-identifier | inline-layout
    layout: $ => choice(
      $.builtin_complex_type,
      $.compound_identifier,
      $.inline_layout,
    ),

    // layout-parameters = layout-parameter | layout-parameter , "," , layout-parameters
    layout_parameters: $ => seq(
      $.layout_parameter,
      repeat(seq(
        ',',
        $.layout_parameter,
      )),
    ),

    // layout-parameter = type-constructor | constant
    //
    // Change: layout in type_constructor can be compound_identifier only which will conflict with
    // compound_identifier in constant.
    layout_parameter: $ => choice(
      $.type_constructor,
      $.literal,
    ),

    // type-constraints = type-constraint | "<" type-constraint-list ">"
    type_constraints: $ => choice(
      $.type_constraint,
      seq(
        '<',
        $.type_constraint_list,
        '>',
      ),
    ),

    // type-constraint-list = type-constraint | type-constraint , "," , type-constraint-list
    type_constraint_list: $ => seq(
      $.type_constraint,
      repeat(seq(
        ',',
        $.type_constraint,
      )),
    ),

    // type-constraint = constant
    //
    // This also allow bit ops.
    type_constraint: $ => $.constant_allows_bit_ops,

    // constant = compound-identifier | literal
    constant: $ => choice(
      $.compound_identifier,
      $.literal,
    ),

    // ordinal = NUMERIC-LITERAL

    // literal = STRING-LITERAL | NUMERIC-LITERAL | "true" | "false"
    literal: $ => choice(
      $.numeric_literal,
      $.string_literal,
      $.bool,
    ),

    // bool literal = "true" | "false"
    bool: $ => choice($.true, $.false),
    true: $ => 'true',
    false: $ => 'false',

    // NUMERIC-LITERAL = positive int only, in Hex or Decimal
    numeric_literal: $ => choice(
      token(seq(optional('-'), repeat1(decimal_digit))),
      token(seq(choice('0x', '0X'), repeat1(hex_digit))),
      token(seq('0b', repeat1(choice('0', '1')))),
      token(seq(optional('-'), repeat1(decimal_digit), '.', repeat(decimal_digit))),
      token(seq(repeat(decimal_digit), '.', repeat1(decimal_digit))),
    ),

    // STRING-LITERAL  = "\"" ( unicode-value )* "\""
    // unicode-value   = literal-char | escaped-basic | escaped-unicode
    // literal-char    = any unicode character except CR, LF, "\" or "\""
    // escaped-basic   = "\" ( "\" | "\"" | "n" | "r" | "t"  )
    // escaped-unicode = "\u{" ( hex-digit ){1,6} "}"

    string_literal: $ => seq(
      '"',
      repeat(choice(
        $._interpreted_string_literal_basic_content,
        $.escape_sequence,
      )),
      token.immediate('"'),
    ),

    _interpreted_string_literal_basic_content: _ => token.immediate(prec(1, /[^"\n\\]+/)),

    escape_sequence: _ => token.immediate(seq(
      '\\',
      choice(
        /[^xuU]/,
        /\d{2,3}/,
        /x[0-9a-fA-F]{2,}/,
        /u[0-9a-fA-F]{4}/,
        /U[0-9a-fA-F]{8}/,
      ),
    )),

    // NOTE 4: `value-layout-member` (also `const`) allows bit operators "|", "&".
    // constant-allows-bit-ops = STRING-LITERAL | bool literal 
    //                         | NUMERIC-LITERAL , ( "|" | "&" , NUMERIC-LITERAL | compound-identifier )*
    //                         | compound-identifier , ( "|" | "&" , NUMERIC-LITERAL | compound-identifier )*
    constant_allows_bit_ops: $ => choice(
      $.string_literal,
      $.bool,
      seq($.numeric_literal, repeat(seq(choice("|", "&"), choice($.numeric_literal, $.compound_identifier)))),
      seq($.compound_identifier, repeat(seq(choice("|", "&"), choice($.numeric_literal, $.compound_identifier)))),
    ),

    // fidl support `//` for comment and `///` for doc comment.
    // But no difference for parser in editor level.
    comment: $ => token(
      seq('//', /.*/),
    ),
  },
});
