import { Scheme, field, args as arguments_, argument, nonNull } from './graph-ql/gql.js'
import { GqlDate } from './graph-ql/gql-date.js'
import { GqlString } from './graph-ql/gql-string.js'
import { GqlBoolean } from './graph-ql/gql-boolean.js'
import { GqlLong } from './graph-ql/gql-long.js'
import { GqlId64, GqlNonNullId64 } from './graph-ql/gql-id64.js'
import { Kinds, Privileges, Directions, OperationTypes, AddressStates } from './api-settings.js'

export function schemeBuild () {
  const typeUnit = Scheme.newType('unit')
  const typeProductType = Scheme.newType('product_type')
  const typeNomenclature = Scheme.newType('nomenclature')
  const typeAffiliation = Scheme.newType('affiliation')
  const typeReason = Scheme.newType('reason')
  const typeUser = Scheme.newType('user')
  const typeOperation = Scheme.newType('operation')
  const typeAddress = Scheme.newType('address')
  const typeState = Scheme.newType('state')
  const typeWarehouse = Scheme.newType('warehouse')
  const typeIncompleteOperation = Scheme.newType('incomplete_operation')
  const typeChange = Scheme.newType('change')
  const typeWorkzone = Scheme.newType('workzone')
  const typeDevice = Scheme.newType('device')
  const typeWebworker = Scheme.newType('webworker')
  typeUnit.addFields([field('value', GqlString), field('id', GqlId64)])
  typeProductType.addFields([field('value', GqlString), field('id', GqlId64)])
  typeNomenclature.addFields([field('designation', GqlString), field('name', GqlString), field('unit', typeUnit), field('product_type', typeProductType), field('id', GqlId64)])
  typeAffiliation.addFields([field('value', GqlString), field('id', GqlId64)])
  typeReason.addFields([field('value', GqlString), field('direction', Scheme.enum(Directions)), field('affiliation', typeAffiliation), field('id', GqlId64)])
  typeUser.addFields([field('login', GqlString), field('password', GqlString), field('privileges', Scheme.set(Scheme.enum(Privileges))), field('fullname', GqlString), field('personnel_number', GqlString), field('id', GqlId64), field('movings', GqlLong), field('states', Scheme.enum(AddressStates))])
  typeOperation.addFields([field('destination', typeAddress), field('weight', GqlLong), field('user', typeUser), field('time_stamp', GqlDate), field('id', GqlId64)])
  typeAddress.addFields([field('kind', Scheme.enum(Kinds)), field('label', GqlString), field('workzone', typeWorkzone), field('x', GqlLong), field('y', GqlLong), field('z', GqlLong), field('id', GqlId64)])
  typeState.addFields([field('source', typeAddress), field('operation', typeOperation, arguments_([argument('destination', GqlNonNullId64)], false)), field('nomenclature', typeNomenclature), field('quantity', GqlLong), field('affiliation', typeAffiliation), field('increment', GqlLong), field('reason', typeReason), field('basis', GqlString), field('id', GqlId64)])
  typeWarehouse.addFields([field('source', typeAddress), field('operation', typeOperation, arguments_([argument('destination', GqlNonNullId64)], false)), field('nomenclature', typeNomenclature), field('quantity', GqlLong), field('affiliation', typeAffiliation), field('increment', GqlLong), field('reason', typeReason), field('basis', GqlString), field('id', GqlId64)])
  typeIncompleteOperation.addFields([field('source', typeAddress), field('operation_type', Scheme.enum(OperationTypes)), field('destination', typeAddress), field('weight', GqlLong), field('user', typeUser), field('time_stamp', GqlDate), field('id', GqlId64)])
  typeChange.addFields([field('incomplete_operation', typeIncompleteOperation), field('nomenclature', typeNomenclature), field('increment', GqlLong), field('reason', typeReason), field('affiliation', typeAffiliation), field('basis', GqlString), field('id', GqlId64)])
  typeWorkzone.addFields([field('incomplete_operation', typeIncompleteOperation), field('status', GqlLong), field('request', GqlLong), field('id', GqlId64), field('message', GqlId64)])
  typeDevice.addFields([field('x', GqlLong), field('y', GqlLong), field('z', GqlLong), field('errors', Scheme.array(GqlLong)), field('warnings', Scheme.array(GqlLong)), field('mode', GqlLong), field('id', GqlId64)])
  typeWebworker.addFields([field('id', GqlLong), field('ip', GqlString), field('user', typeUser)])
  Scheme.newQuery('create_token', GqlString, arguments_([argument('seed', GqlString)]))
  Scheme.newQuery('users', Scheme.map(typeUser), arguments_([argument('id', GqlNonNullId64)], false))
  Scheme.newQuery('product_types', Scheme.map(typeProductType), arguments_([argument('id', GqlNonNullId64)], false))
  Scheme.newQuery('units', Scheme.map(typeUnit), arguments_([argument('id', GqlNonNullId64)], false))
  Scheme.newQuery('workzones', Scheme.map(typeWorkzone), arguments_([argument('id', GqlNonNullId64)], false))
  Scheme.newQuery('unit_insert', GqlNonNullId64, arguments_([argument('value', GqlString)]))
  Scheme.newQuery('unit_delete', GqlBoolean, arguments_([argument('id', GqlNonNullId64)]))
  Scheme.newQuery('unit_update_value', GqlBoolean, arguments_([argument('id', GqlNonNullId64), argument('old', GqlString), argument('new', GqlString)]))
  Scheme.newQuery('affiliation_insert', GqlNonNullId64, arguments_([argument('value', GqlString)]))
  Scheme.newQuery('affiliation_delete', GqlBoolean, arguments_([argument('id', GqlNonNullId64)]))
  Scheme.newQuery('affiliation_update_value', GqlBoolean, arguments_([argument('id', GqlNonNullId64), argument('old', GqlString), argument('new', GqlString)]))
  Scheme.newQuery('nomenclature', Scheme.map(typeNomenclature), arguments_([argument('id', GqlNonNullId64)], false))
  Scheme.newQuery('nomenclature_insert', GqlNonNullId64, arguments_([argument('designation', GqlString), argument('name', GqlString), argument('unit', GqlNonNullId64), argument('product_type', GqlNonNullId64)]))
  Scheme.newQuery('nomenclature_delete', GqlBoolean, arguments_([argument('id', GqlNonNullId64)]))
  Scheme.newQuery('nomenclature_update_designation', GqlBoolean, arguments_([argument('id', GqlNonNullId64), argument('old', GqlString), argument('new', GqlString)]))
  Scheme.newQuery('nomenclature_update_name', GqlBoolean, arguments_([argument('id', GqlNonNullId64), argument('old', GqlString), argument('new', GqlString)]))
  Scheme.newQuery('nomenclature_update_unit', GqlBoolean, arguments_([argument('id', GqlNonNullId64), argument('old', GqlId64), argument('new', GqlId64)]))
  Scheme.newQuery('nomenclature_update_product_type', GqlBoolean, arguments_([argument('id', GqlNonNullId64), argument('old', GqlId64), argument('new', GqlId64)]))
  Scheme.newQuery('affiliation', Scheme.map(typeAffiliation), arguments_([argument('id', GqlNonNullId64)], false))
  Scheme.newQuery('reasons', Scheme.map(typeReason), arguments_([argument('id', GqlNonNullId64)], false))
  Scheme.newQuery('states', Scheme.map(typeState), arguments_([argument('id', GqlNonNullId64)], false))
  Scheme.newQuery('warehouse', Scheme.map(typeWarehouse), arguments_([argument('id', GqlNonNullId64), argument('operation', GqlLong)], false))
  Scheme.newQuery('addresses', Scheme.map(typeAddress), arguments_([argument('id', GqlNonNullId64)], false))
  Scheme.newQuery('address_insert', GqlNonNullId64, arguments_([argument('id', GqlNonNullId64), argument('workzone', GqlLong), argument('x', GqlLong), argument('y', GqlLong)]))
  Scheme.newQuery('change_insert', GqlNonNullId64, arguments_([argument('incomplete_operation', GqlNonNullId64), argument('nomenclature', GqlNonNullId64), argument('increment', GqlLong), argument('reason', GqlNonNullId64), argument('affiliation', GqlNonNullId64), argument('basis', GqlString)]))
  Scheme.newQuery('change_delete', GqlBoolean, arguments_([argument('id', GqlNonNullId64)]))
  Scheme.newQuery('run_operation', GqlBoolean, arguments_([argument('incomplete_operation', GqlNonNullId64)]))
  Scheme.newQuery('cancel_operation', GqlBoolean, arguments_([argument('incomplete_operation', GqlNonNullId64)]))
  Scheme.newQuery('operator_accept', GqlBoolean, arguments_([argument('incomplete_operation', GqlNonNullId64)]))
  Scheme.newQuery('address_update_kind', GqlBoolean, arguments_([argument('id', GqlNonNullId64), argument('old', Scheme.enum(Kinds)), argument('new', Scheme.enum(Kinds))]))
  Scheme.newQuery('address_update_label', GqlBoolean, arguments_([argument('id', GqlNonNullId64), argument('old', GqlString), argument('new', GqlString)]))
  Scheme.newQuery('address_update_workzone', GqlBoolean, arguments_([argument('id', GqlNonNullId64), argument('old', GqlId64), argument('new', GqlId64)]))
  Scheme.newQuery('address_update_x', GqlBoolean, arguments_([argument('id', GqlNonNullId64), argument('old', GqlLong), argument('new', GqlLong)]))
  Scheme.newQuery('address_update_y', GqlBoolean, arguments_([argument('id', GqlNonNullId64), argument('old', GqlLong), argument('new', GqlLong)]))
  Scheme.newQuery('address_update_z', GqlBoolean, arguments_([argument('id', GqlNonNullId64), argument('old', GqlLong), argument('new', GqlLong)]))
  Scheme.newQuery('create_operation', GqlNonNullId64, arguments_([argument('source', GqlNonNullId64), argument('destination', GqlNonNullId64)]))
  Scheme.newQuery('operations', Scheme.map(typeOperation), arguments_([argument('id', GqlNonNullId64)], false))
  Scheme.newQuery('incomplete_operations', Scheme.map(typeIncompleteOperation), arguments_([argument('id', GqlNonNullId64)], false))
  Scheme.newQuery('changes', Scheme.map(typeChange), arguments_([argument('id', GqlNonNullId64)], false))
  Scheme.newQuery('webworkers', Scheme.map(typeWebworker), arguments_([argument('id', GqlString)], false))
  Scheme.newQuery('devices', Scheme.map(typeDevice), arguments_([argument('id', nonNull(GqlNonNullId64))], false))
  Scheme.newQuery('incomplete_operation_delete', GqlBoolean, arguments_([argument('id', GqlNonNullId64)]))
  Scheme.newQuery('user_insert', GqlNonNullId64, arguments_([argument('login', GqlString), argument('password', GqlString)]))
  Scheme.newQuery('user_delete', GqlBoolean, arguments_([argument('id', GqlNonNullId64)]))
  Scheme.newQuery('user_update_login', GqlBoolean, arguments_([argument('id', GqlNonNullId64), argument('old', GqlString), argument('new', GqlString)]))
  Scheme.newQuery('user_update_password', GqlBoolean, arguments_([argument('id', GqlNonNullId64), argument('old', GqlString), argument('new', GqlString)]))
  Scheme.newQuery('user_update_privileges', GqlBoolean, arguments_([argument('id', GqlNonNullId64), argument('old', Scheme.enum(Privileges)), argument('new', Scheme.enum(Privileges))]))
  Scheme.newQuery('user_update_fullname', GqlBoolean, arguments_([argument('id', GqlNonNullId64), argument('old', GqlString), argument('new', GqlString)]))
  Scheme.newQuery('user_update_personnel_number', GqlBoolean, arguments_([argument('id', GqlNonNullId64), argument('old', GqlString), argument('new', GqlString)]))
  Scheme.newQuery('product_type_update_value', GqlBoolean, arguments_([argument('id', GqlNonNullId64), argument('old', GqlString), argument('new', GqlString)]))
  Scheme.newQuery('user_update_privilege', GqlBoolean, arguments_([argument('id', GqlNonNullId64), argument('privilege', Scheme.enum(Privileges)), argument('old', GqlBoolean), argument('new', GqlBoolean)]))
  Scheme.newQuery('change_mode', GqlBoolean, arguments_([argument('id', GqlNonNullId64), argument('mode', GqlLong)]))
  Scheme.newQuery('reset', GqlBoolean, arguments_([argument('id', GqlNonNullId64)]))
  Scheme.newQuery('release_safety_lock', GqlBoolean, arguments_([argument('password', GqlString)]))
  Scheme.newQuery('product_type_insert', GqlBoolean, arguments_([argument('id', GqlNonNullId64), argument('value', GqlString)]))
  Scheme.newQuery('product_type_delete', GqlBoolean, arguments_([argument('id', GqlNonNullId64)]))
  Scheme.newQuery('done_operation_after_error', GqlNonNullId64, arguments_([argument('id', GqlNonNullId64)]))
  Scheme.newQuery('rollback_operation_after_error', GqlNonNullId64, arguments_([argument('id', GqlNonNullId64)]))
  Scheme.newQuery('reason_insert', GqlNonNullId64, arguments_([argument('value', GqlString), argument('direction', Scheme.enum(Directions))]))
  Scheme.newQuery('reason_delete', GqlBoolean, arguments_([argument('id', GqlNonNullId64)]))
  Scheme.newQuery('reason_update_value', GqlBoolean, arguments_([argument('id', GqlNonNullId64), argument('old', GqlString), argument('new', GqlString)]))
  Scheme.newQuery('reason_update_direction', GqlBoolean, arguments_([argument('id', GqlNonNullId64), argument('old', Scheme.enum(Directions)), argument('new', Scheme.enum(Directions))]))
  Scheme.newQuery('reason_update_affiliation', GqlBoolean, arguments_([argument('id', GqlNonNullId64), argument('old', GqlId64), argument('new', GqlId64)]))
  Scheme.newQuery('generate_random_operation', GqlNonNullId64, arguments_([argument('workzone', GqlNonNullId64)]))
  Scheme.newQuery('change_update_incomplete_operation', GqlBoolean, arguments_([argument('id', GqlNonNullId64), argument('old', GqlId64), argument('new', GqlId64)]))
  Scheme.newQuery('change_update_nomenclature', GqlBoolean, arguments_([argument('id', GqlNonNullId64), argument('old', GqlId64), argument('new', GqlId64)]))
  Scheme.newQuery('change_update_increment', GqlBoolean, arguments_([argument('id', GqlNonNullId64), argument('old', GqlLong), argument('new', GqlLong)]))
  Scheme.newQuery('change_update_reason', GqlBoolean, arguments_([argument('id', GqlNonNullId64), argument('old', GqlId64), argument('new', GqlId64)]))
  Scheme.newQuery('change_update_affiliation', GqlBoolean, arguments_([argument('id', GqlNonNullId64), argument('old', GqlId64), argument('new', GqlId64)]))
  Scheme.newQuery('change_update_basis', GqlBoolean, arguments_([argument('id', GqlNonNullId64), argument('old', GqlString), argument('new', GqlString)]))
}
