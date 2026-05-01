import { useParams } from 'react-router-dom'
import ManualEditor from '../../components/editor/ManualEditor'

function ManualEditorPage() {
  const { id } = useParams()
  return <ManualEditor manualId={id} />
}

export default ManualEditorPage
