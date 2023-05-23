import Button from 'components/Button';
import Layout from 'components/Layout';
import React, { useState, useRef, useEffect } from 'react';
import Upload from 'components/Upload';
import FileSaver from 'file-saver';
import { Col } from 'react-bootstrap';
import { useSnackbar } from 'components/Snackbar';
import Text from 'components/Text';
import Input from 'components/Input';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

export default function Xml() {
  const [current, setCurrent] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [data, setData] = useState({});
  const uploadRef = useRef();
  const snackbar = useSnackbar();

  async function setFile(files) {
    try {
      const xmlArray = [];
      for await (const xml of files) {
        const reader = new FileReader();
        reader.readAsText(xml);
        await new Promise(resolve => {
          reader.onload = () => {
            xmlArray.push({
              name: xml.name,
              content: reader.result,
              type: xml.type,
            });
            resolve();
          };
        });
      }
      if (xmlArray !== null) {
        console.log('XML PRA CONSULTA', xmlArray[0].content);
      }
      setFileList(xmlArray);
    } catch (err) {
      snackbar.show(<Text>{err.message}</Text>, {
        type: 'error',
        duration: 5000,
      });
    }
  }

  function editWeightAply(xml) {
    if (xml != null) {
      const editedXml = xml.replace(
        /<pesoL>[0-9]{1,}[.]{0,}[0-9]{0,}<\/pesoL>/gm,
        `<pesoL>${data.netWeight}</pesoL>`
      );
      const finalEditedXml = editedXml.replace(
        /<pesoB>[0-9]{1,}[.]{0,}[0-9]{0,}<\/pesoB>/g,
        `<pesoB>${data.grossWeight}</pesoB>`
      );
      console.log('TESTE DO PESO EDITADO', editedXml);
      return finalEditedXml;
    }
  }

  function turnOverAply(xml) {
    const parser = new XMLParser({
      ignoreDeclaration: true,
    });
    const builder = new XMLBuilder();
    if (xml != null) {
      const parsedXml = parser.parse(xml);

      if (parsedXml.nfeProc.NFe.infNFe.transp.modFrete === 0) {
        console.log('entrou');
        const editedXml = xml.replace(
          `<modFrete>0</modFrete>`,
          `<modFrete>1</modFrete>`
        );
        const parsedXml2 = parser.parse(editedXml);
        const { enderEmit } = parsedXml2.nfeProc.NFe.infNFe.emit;
        const { enderDest } = parsedXml2.nfeProc.NFe.infNFe.dest;
        const teste = { ...enderEmit };

        parsedXml2.nfeProc.NFe.infNFe.emit.enderEmit = enderDest;
        parsedXml2.nfeProc.NFe.infNFe.dest.enderDest = teste;

        const finalXml = builder.build(parsedXml2);

        const finalXml2 = finalXml
          .replace(/emit/g, `aux`)
          .replace(/dest/g, `emit`)
          .replace(/aux/g, `dest`);

        console.log('Final Reverte', finalXml);

        return finalXml2;
      }
      const editedXml = xml.replace(
        `<modFrete>1</modFrete>`,
        `<modFrete>0</modFrete>`
      );
      const parsedXml2 = parser.parse(editedXml);
      const { enderEmit } = parsedXml2.nfeProc.NFe.infNFe.emit;
      const { enderDest } = parsedXml2.nfeProc.NFe.infNFe.dest;
      const teste = { ...enderEmit };

      parsedXml2.nfeProc.NFe.infNFe.emit.enderEmit = enderDest;
      parsedXml2.nfeProc.NFe.infNFe.dest.enderDest = teste;

      const finalXml = builder.build(parsedXml2);

      const finalXml2 = finalXml
        .replace(/emit/g, `aux`)
        .replace(/dest/g, `emit`)
        .replace(/aux/g, `dest`);

      console.log('Final Reverte', finalXml);

      return finalXml2;
    }
  }

  const Action_option = [
    {
      title: 'Alterar Peso',
      component: <EditWeight />,
      edit: editWeightAply,
    },
    {
      title: 'Inverter Rem/Dest',
      component: <TurnOver />,
      edit: turnOverAply,
    },
  ];

  function downlodXml() {
    fileList.forEach(file => {
      const final = Action_option[current].edit(file.content);
      FileSaver.saveAs(
        new Blob([final]),
        `${file.name.replace(/\.xml$/, '')}_alterado.xml`
      );
    });
  }

  function EditWeight() {
    let netValue;
    let grossValue;

    return (
      <>
        <Input
          label="Peso líguido"
          onChange={e => {
            netValue = e.target.value;
          }}
          style={{ margin: '10px' }}
          value={netValue}
        />
        <Input
          label="Peso Sólido"
          onChange={e => {
            grossValue = e.target.value;
          }}
          style={{ margin: '10px' }}
          value={grossValue}
        />
        <div>
          <Button
            onClick={() =>
              setData({ ...data, netWeight: netValue, grossWeight: grossValue })
            }
            type="button"
          >
            Salvar
          </Button>
        </div>
      </>
    );
  }

  function TurnOver() {
    return <Text>Alterado com sucesso!</Text>;
  }

  function setCurrentClick(index) {
    setCurrent(index);
  }

  return (
    <Layout>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          flexDirection: 'column',
          margin: 'auto',
          width: '20%',
          height: '40',
        }}
      >
        {Action_option.map((i, index) => (
          <Button
            style={{ margin: '10px' }}
            onClick={() => setCurrentClick(index)}
          >
            {i.title}
          </Button>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          flexDirection: 'column',
          margin: 'auto',
          textAlign: 'center',
          width: '20%',
          height: '40',
        }}
      >
        {current !== null &&
          React.cloneElement(Action_option[current].component)}
      </div>
      <Col xs={3} style={{ margin: 'auto', marginTop: '10px' }}>
        <Upload
          className="w-100"
          class={{ width: '100%' }}
          label="Importar XML"
          onChange={event => {
            setFile(Object.values(event.target.files));
          }}
          accept={['.xml', '.zip']}
          multiple
          ref={uploadRef}
        />
      </Col>
      <Col
        xs={6}
        style={{
          display: 'flex',
          justifyContent: 'center',
          margin: 'auto',
          marginTop: '20px',
        }}
      >
        <Button onClick={downlodXml}>Baixar Xml</Button>
      </Col>
    </Layout>
  );
}