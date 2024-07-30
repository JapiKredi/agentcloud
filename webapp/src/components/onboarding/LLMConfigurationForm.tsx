import * as API from '@api';
import { ChevronRightIcon } from '@heroicons/react/20/solid';
import { InformationCircleIcon } from '@heroicons/react/20/solid';
import { CheckBadgeIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import ButtonSpinner from 'components/ButtonSpinner';
import InputField from 'components/form/InputField';
import OnboardingSelect from 'components/onboarding/OnboardingSelect';
import ToolTip from 'components/shared/ToolTip';
import { useAccountContext } from 'context/account';
import useResponsive from 'hooks/useResponsive';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import {
	ModelEmbeddingLength,
	ModelList,
	modelOptions,
	ModelType,
	ModelTypeRequirements
} from 'struct/model';
import { TeamModelResponse } from 'types/teammodels';

interface LLMOption {
	label: string;
	value: string;
	iconURL?: string;
	recommended?: boolean;
}

interface LLMConfigurationFormValues {
	LLMType: LLMOption;
	LLMModel: LLMOption;
	embeddingType: LLMOption;
	embeddingModel: LLMOption;
	llmModelConfig: Record<string, string>;
	embeddedModelConfig: Record<string, string>;
}

const LLMConfigurationForm = () => {
	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext;
	const router = useRouter();
	const resourceSlug = router?.query?.resourceSlug || account?.currentTeam;

	const [isMounted, setIsMounted] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [teamModels, setTeamModels] = useState<TeamModelResponse>();

	const [userSelectedLLMType, setUserSelectedLLMType] = useState(false);
	const [userSelectedEmbeddingType, setUserSelectedEmbeddingType] = useState(false);

	const handleSetUserSelectedLLMType = () => {
		setUserSelectedLLMType(true);
	};

	const handleSetUserSelectedEmbeddingType = () => {
		setUserSelectedEmbeddingType(true);
	};

	const fetchDatasourceFormData = async () => {
		await API.getTeamModels({ resourceSlug }, setTeamModels, null, router);
	};

	const { control, watch, resetField, handleSubmit, reset } = useForm<LLMConfigurationFormValues>({
		defaultValues: {
			LLMType: modelOptions[0],
			LLMModel: { label: 'gpt-4o-mini', value: 'gpt-4o-mini' },
			embeddingModel: { label: 'text-embedding-3-small', value: 'text-embedding-3-small' },
			embeddingType: modelOptions[0]
		}
	});

	const { LLMType, embeddingType, LLMModel, embeddingModel } = watch();

	const modelList =
		[
			{ label: null, value: null },
			...ModelList[LLMType.value]
				.filter(model => !ModelEmbeddingLength[model])
				.map(model => ({
					label: model,
					value: model,
					...(model === 'gpt-4o-mini' ? { recommended: true } : {})
				}))
		] || [];
	const embeddingModelList =
		[
			{ label: null, value: null },
			...ModelList[embeddingType?.value]
				.filter(model => ModelEmbeddingLength[model])
				.map(model => ({ label: model, value: model }))
		] || [];

	const isOpenAISelectedLLMType = LLMType.value === ModelType.OPENAI;
	const isOpenAISelectedEmbeddingType = embeddingType.value === ModelType.OPENAI;

	// const embeddingAPIKeyValue = embeddingAPIKey && embeddingAPIKey.startsWith('sk-') && embeddingAPIKey.length > 10
	// 	? `${embeddingAPIKey.substring(0, 3)}${'X'.repeat(embeddingAPIKey.length - 3)}`
	// 	: embeddingAPIKey;

	// const llmAPIKeyValue = llmAPIKey && llmAPIKey.startsWith('sk-') && llmAPIKey.length > 10
	// 	? `${llmAPIKey.substring(0, 3)}${'X'.repeat(llmAPIKey.length - 3)}`
	// 	: llmAPIKey;

	const LLMModelRequiredFields = Object.keys(ModelTypeRequirements[LLMType.value])
		.filter(key => !ModelTypeRequirements[LLMType.value][key].optional)
		.map(key => {
			const label = key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
			const placeholder = key.endsWith('key') ? 'Paste your API key' : `Enter the ${label}`;
			return { name: `llmModelConfig.${key}`, label, placeholder };
		});

	const EmbeddingModelRequiredFields = Object.keys(ModelTypeRequirements[embeddingType?.value])
		.filter(key => !ModelTypeRequirements[embeddingType?.value][key].optional)
		.map(key => {
			const label = key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
			const placeholder = key.endsWith('key') ? 'Paste your API key' : `Enter the ${label}`;
			return { name: `embeddedModelConfig.${key}`, label, placeholder };
		});

	const { isTablet, isMobile } = useResponsive();

	const onSubmit = async (data: LLMConfigurationFormValues) => {
		setSubmitting(true);
		const promises = [];

		if (data.LLMModel.value) {
			const llmBody = {
				_csrf: csrf,
				resourceSlug,
				name: data.LLMType.label,
				model: data.LLMModel.value,
				type: data.LLMType.value,
				config: {
					model: data.LLMModel.value,
					...data.llmModelConfig
				}
			};

			const llmPromise = API.addModel(
				llmBody,
				null,
				res => {
					toast.error(res);
				},
				null
			).then(addedModel => {
				const setDefaultModelBody = {
					_csrf: csrf,
					resourceSlug,
					modelId: addedModel._id,
					modelType: 'llm'
				};

				return API.setDefaultModel(setDefaultModelBody, null, res => toast.error(res), null);
			});

			promises.push(llmPromise);
		}

		if (data.embeddingModel.value) {
			const embeddingBody = {
				_csrf: csrf,
				resourceSlug,
				name: data.embeddingType.label,
				model: data.embeddingModel.value,
				type: data.embeddingType.value,
				config: {
					model: data.embeddingModel.value,
					...data.embeddedModelConfig
				}
			};

			const embeddingPromise = API.addModel(
				embeddingBody,
				null,
				res => toast.error(res),
				null
			).then(addedModel => {
				const setDefaultModelBody = {
					_csrf: csrf,
					resourceSlug,
					modelId: addedModel._id,
					modelType: 'embedding'
				};

				return API.setDefaultModel(setDefaultModelBody, null, res => toast.error(res), null);
			});

			promises.push(embeddingPromise);
		}

		await Promise.all(promises);

		router.push(`/${resourceSlug}/app/add`);

		setSubmitting(false);
	};

	useEffect(() => {
		setIsMounted(true);
	}, []);

	useEffect(() => {
		if (teamModels) {
			const teamLLMModel = teamModels?.data?.llmModel;
			const teamEmbeddingModel = teamModels?.data?.embeddingModel;

			reset({
				LLMType: teamLLMModel
					? { label: teamLLMModel.name, value: teamLLMModel.type }
					: modelOptions[0],
				embeddingType: teamEmbeddingModel
					? { label: teamEmbeddingModel.name, value: teamEmbeddingModel.type }
					: modelOptions[0],
				LLMModel: teamLLMModel
					? { label: teamLLMModel.model, value: teamLLMModel.model }
					: { label: 'gpt-4o-mini', value: 'gpt-4o-mini' },
				embeddingModel: teamEmbeddingModel
					? { label: teamEmbeddingModel.model, value: teamEmbeddingModel.model }
					: { label: 'text-embedding-3-small', value: 'text-embedding-3-small' },
				llmModelConfig: {
					...(teamLLMModel?.config && { ...teamLLMModel.config })
				},
				embeddedModelConfig: {
					...(teamEmbeddingModel?.config && { ...teamEmbeddingModel.config })
				}
			});
		}
	}, [teamModels, reset]);

	useEffect(() => {
		if (LLMType && userSelectedLLMType) {
			resetField('LLMModel', {
				defaultValue: { label: null, value: null }
			});
			setUserSelectedLLMType(false);
		}
	}, [LLMType]);

	useEffect(() => {
		if (embeddingType && userSelectedEmbeddingType) {
			resetField('embeddingModel', {
				defaultValue: { label: null, value: null }
			});
			setUserSelectedEmbeddingType(false);
		}
	}, [embeddingType]);

	useEffect(() => {
		if (resourceSlug) {
			fetchDatasourceFormData();
		}
	}, [resourceSlug]);

	if (!isMounted) {
		return null;
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)}>
			<div className='mt-14 flex gap-8 flex-col md:flex-row'>
				<div className='flex-1'>
					<div className='text-sm flex gap-1'>
						<span>Select LLM</span>
						<ToolTip content='Hello world'>
							<span className='cursor-pointer'>
								<InformationCircleIcon className='h-4 w-4 text-gray-400' />
							</span>
						</ToolTip>
					</div>
					<div className='flex'>
						<div className='w-1/2 sm:w-2/5'>
							<OnboardingSelect<LLMConfigurationFormValues>
								options={modelOptions}
								classNames={{ listboxButton: 'rounded-l-md bg-gray-100', listboxOptions: 'left-0' }}
								control={control}
								name='LLMType'
								callback={handleSetUserSelectedLLMType}
							/>
						</div>
						<div className='w-1/2 sm:flex-1'>
							<OnboardingSelect<LLMConfigurationFormValues>
								options={modelList}
								classNames={{ listboxButton: 'rounded-r-md bg-gray-50', listboxOptions: 'right-0' }}
								control={control}
								name='LLMModel'
							/>
						</div>
					</div>

					<div
						className={clsx(
							'flex gap-2 bg-primary-50 text-primary-800 text-xs mt-2 min-h-8 justify-start items-center rounded-md ml-1 p-1',
							{ 'bg-white': LLMModel?.value !== 'gpt-4o-mini' }
						)}
					>
						{LLMModel?.value === 'gpt-4o-mini' && (
							<>
								<CheckBadgeIcon className='h-6 w-6' />
								<div>Best for overall speed, cost, performance, and tool integration</div>
							</>
						)}
					</div>

					{isMobile && (
						<div className='mt-2'>
							{LLMModelRequiredFields.length > 0 &&
								LLMModelRequiredFields.map(field => (
									<div key={field.name} className='mt-2'>
										<InputField<LLMConfigurationFormValues>
											name={field.name as keyof LLMConfigurationFormValues}
											rules={{ required: LLMModel?.value ? `${field.label} is required` : false }}
											label={field.label}
											type='text'
											control={control}
											placeholder={field.placeholder}
											disabled={!LLMModel || !LLMModel.value}
										/>
									</div>
								))}
						</div>
					)}
				</div>

				<div className='flex-1'>
					<div className='text-sm flex gap-1'>
						<span>Select Embedding</span>
						<ToolTip content='Embedding models are used to when storing your data into the vector DB and by the Agent for RAG retrieval'>
							<span className='cursor-pointer'>
								<InformationCircleIcon className='h-4 w-4 text-gray-400' />
							</span>
						</ToolTip>
					</div>
					<div className='flex'>
						<div className='w-1/2 sm:w-2/5'>
							<OnboardingSelect<LLMConfigurationFormValues>
								options={modelOptions}
								classNames={{ listboxButton: 'rounded-l-md bg-gray-100', listboxOptions: 'left-0' }}
								control={control}
								name='embeddingType'
								callback={handleSetUserSelectedEmbeddingType}
							/>
						</div>
						<div className='w-1/2 sm:flex-1'>
							<OnboardingSelect<LLMConfigurationFormValues>
								options={embeddingModelList}
								classNames={{ listboxButton: 'rounded-r-md bg-gray-50', listboxOptions: 'right-0' }}
								control={control}
								name='embeddingModel'
							/>
						</div>
					</div>

					<div
						className={clsx(
							'flex gap-2 bg-primary-50 text-primary-800 text-xs mt-2 min-h-8 justify-start items-center rounded-md ml-1 p-1',
							{ 'bg-white': embeddingModel?.value !== 'text-embedding-3-small' }
						)}
					>
						{embeddingModel?.value === 'text-embedding-3-small' && (
							<>
								<CheckBadgeIcon className='h-6 w-6' />
								<div>Excellent for RAG, with great cost efficiency and performance.</div>
							</>
						)}
					</div>

					{isMobile &&
						EmbeddingModelRequiredFields.length > 0 &&
						EmbeddingModelRequiredFields.map(field => (
							<div key={field.name} className='mt-2'>
								<InputField<LLMConfigurationFormValues>
									name={field.name as keyof LLMConfigurationFormValues}
									rules={{ required: embeddingModel?.value ? `${field.label} is required` : false }}
									label={field.label}
									type='text'
									control={control}
									placeholder={field.placeholder}
									disabled={!LLMModel || !LLMModel.value}
								/>
							</div>
						))}
				</div>
			</div>

			{isTablet && (
				<div className='flex gap-8 mt-4'>
					<div className='flex-1'>
						{LLMModelRequiredFields.length > 0 &&
							LLMModelRequiredFields.map(field => (
								<div key={field.name}>
									<InputField<LLMConfigurationFormValues>
										name={field.name as keyof LLMConfigurationFormValues}
										rules={{ required: LLMModel?.value ? `${field.label} is required` : false }}
										label={field.label}
										type='text'
										control={control}
										placeholder={field.placeholder}
										disabled={!LLMModel || !LLMModel.value}
									/>
								</div>
							))}
					</div>
					<div className='flex-1'>
						{EmbeddingModelRequiredFields.length > 0 &&
							EmbeddingModelRequiredFields.map(field => (
								<div key={field.name}>
									<InputField<LLMConfigurationFormValues>
										name={field.name as keyof LLMConfigurationFormValues}
										rules={{
											required: embeddingModel?.value ? `${field.label} is required` : false
										}}
										label={field.label}
										type='text'
										control={control}
										placeholder={field.placeholder}
										// value={embeddingAPIKeyValue}
										disabled={!embeddingModel || !embeddingModel.value}
									/>
								</div>
							))}
					</div>
				</div>
			)}

			<hr className='mt-14 mb-5' />
			<div className='flex'>
				<button
					className='w-[137px] h-[41px] border border-gray-200 rounded-lg text-sm'
					type='button'
					onClick={() => {
						router.push(`/${resourceSlug}/app/add`);
					}}
				>
					I&apos;ll do this later
				</button>
				<button
					className='ml-auto w-[140px] h-[41px] disabled:bg-primary-200 bg-primary-500 text-white rounded-lg flex justify-center items-center text-sm'
					type='submit'
					disabled={!LLMModel?.value && !embeddingModel?.value}
				>
					{submitting ? (
						<ButtonSpinner className='mt-1 me-2' />
					) : (
						<>
							<span className='text-sm'>Get Started</span>
							<ChevronRightIcon className='ml-2 h-5 w-5' />
						</>
					)}
				</button>
			</div>
		</form>
	);
};

export default LLMConfigurationForm;
